import type { APIRoute } from "astro";
import { createHash, randomUUID } from "node:crypto";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { account, auditEvents, bootstrapAttempts, bootstrapClaim, posts, user } from "../../../db/schema";
import { getAuth } from "../../../lib/auth";
import { getDatabase } from "../../../lib/database";
import { bootstrapConfiguration } from "../../../lib/bootstrap";
import { opaqueRateKey, sameOriginJson, secureCompare, verifyCsrf } from "../../../lib/security";

const inputSchema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
  capability: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict();

const initialDrafts = [
  { slug: "payments-that-can-be-retried", title: "Designing payment flows that can be retried", description: "A draft on idempotency, webhook verification, and keeping payment state consistent across retries.", bodyMarkdown: "Payment systems have to expect repetition. A network can fail after a provider accepts a request, and a webhook can arrive more than once. Treating every delivery as a new event makes duplicate work likely.\n\nIn the SimFree backend, payment webhooks use an eight-day idempotency window. That detail sits beside verification and catalog caching: a provider event should be checked, recorded, and applied in a way that remains safe if the same event is seen again.\n\nA useful starting point is to give each provider event a stable identity, verify its signature before changing state, and make the state transition conditional on what the system has already recorded. Retries then become a recovery path rather than a second payment.\n\n> Editorial note: this is an unpublished draft based on project notes. Review it before publishing.", tags: ["payments", "reliability"], readTime: "6 min read" },
  { slug: "email-imports-that-recover", title: "Email imports need a recovery path", description: "A draft about duplicate protection, quarantine, and replay in a mailbox sync workflow.", bodyMarkdown: "Mailbox sync is not a one-time import. Messages can be retried, providers can return incomplete data, and an operator sometimes needs to understand why a record did not arrive.\n\nThe LeadPylot email service combines IMAP sync with Gmail OAuth, SMTP delivery, approvals, and inbound-email lead creation. Its import workflow includes duplicate protection plus quarantine and replay for failed imports.\n\nThose pieces make failures easier to inspect and recover from. A quarantine keeps a problematic item from silently disappearing into the happy path; replay gives the system a deliberate way to try again after the cause is understood.\n\n> Editorial note: this is an unpublished draft based on project notes. Review it before publishing.", tags: ["email", "reliability"], readTime: "5 min read" },
];

async function bumpBootstrapAttempts(db: Awaited<ReturnType<typeof getDatabase>>, keyHash: string) {
  const now = new Date();
  const [row] = await db.insert(bootstrapAttempts).values({ keyHash, windowStartedAt: now, count: 1 }).onConflictDoUpdate({
    target: bootstrapAttempts.keyHash,
    set: {
      count: sql`CASE WHEN ${bootstrapAttempts.windowStartedAt} < now() - interval '15 minutes' THEN 1 ELSE ${bootstrapAttempts.count} + 1 END`,
      windowStartedAt: sql`CASE WHEN ${bootstrapAttempts.windowStartedAt} < now() - interval '15 minutes' THEN now() ELSE ${bootstrapAttempts.windowStartedAt} END`,
    },
  }).returning({ count: bootstrapAttempts.count });
  return row.count;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const config = bootstrapConfiguration();
  if (!config) return Response.json({ error: "First-admin setup is unavailable." }, { status: 503 });
  try {
    const db = await getDatabase();
    // The shared bucket limits distributed guessing; the address bucket limits a single client.
    const globalAttempts = await bumpBootstrapAttempts(db, opaqueRateKey("bootstrap:global"));
    const clientAttempts = await bumpBootstrapAttempts(db, opaqueRateKey(`bootstrap:client:${clientAddress}`));
    if (globalAttempts > 40 || clientAttempts > 8) return Response.json({ error: "Too many setup attempts. Try again after 15 minutes." }, { status: 429 });
    if (Number(request.headers.get("content-length") ?? 0) > 5000) return Response.json({ error: "Request too large." }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Invalid request body." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 5000) { await reader.cancel(); return Response.json({ error: "Request too large." }, { status: 413 }); }
      chunks.push(value);
    }
    let raw: unknown;
    try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) return Response.json({ error: "Check the email, name, password, and setup code fields." }, { status: 400 });
    const input = parsed.data;
    const digest = createHash("sha256").update(input.capability, "utf8").digest("hex");
    if (!secureCompare(digest, config.hash)) return Response.json({ error: "Setup is unavailable or the code is invalid." }, { status: 401 });

    const auth = await getAuth();
    const context = await auth.$context;
    const passwordHash = await context.password.hash(input.password);
    const id = randomUUID();
    const created = await db.transaction(async (tx) => {
      // The singleton claim serializes contenders and survives configuration changes.
      // An aborted transaction rolls it back along with all provisioned rows.
      const claim = await tx.insert(bootstrapClaim).values({ id: "owner" }).onConflictDoNothing().returning();
      if (!claim.length) return false;
      const [valid] = await tx.select({ valid: sql<boolean>`clock_timestamp() < ${config.expiresAt}::timestamptz` }).from(bootstrapClaim).where(eq(bootstrapClaim.id, "owner"));
      if (!valid.valid) throw new Error("bootstrap expired");
      const [admins] = await tx.select({ total: count() }).from(user).where(eq(user.role, "admin"));
      if (admins.total > 0) throw new Error("owner exists");
      await tx.insert(user).values({ id, email: input.email.toLowerCase(), name: input.name, emailVerified: false, role: "admin" });
      await tx.insert(account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: passwordHash });
      await tx.insert(auditEvents).values({ id: randomUUID(), actorId: id, action: "admin.provisioned", entityType: "user", entityId: id, metadata: {} });
      await tx.insert(posts).values(initialDrafts.map((draft) => ({ ...draft, id: randomUUID(), status: "draft" as const, authorId: id, tags: draft.tags, publishedAt: null }))).onConflictDoNothing({ target: posts.slug });
      return true;
    });
    if (!created) return Response.json({ error: "First-admin setup is unavailable." }, { status: 410 });
    return Response.json({ ok: true, message: "Admin provisioned. Sign in and finish authenticator setup." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "First-admin setup is unavailable. Check configuration and database migration." }, { status: 503 });
  }
};
