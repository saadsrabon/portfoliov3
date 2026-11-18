import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, bootstrapAttempts, posts, user } from "../../../db/schema";
import { getAuth } from "../../../lib/auth";
import { getDatabase } from "../../../lib/database";
import { opaqueRateKey, sameOriginJson, secureCompare, verifyCsrf } from "../../../lib/security";

const inputSchema = z.object({
  email: z.email().max(254),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
  bootstrapSecret: z.string().min(32).max(256),
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
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_BOOTSTRAP_SECRET) return Response.json({ error: "First-admin setup is not configured." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 5000) return Response.json({ error: "Request too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Check the email, name, password, and setup secret fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const input = parsed.data;
  if (!secureCompare(input.email.toLowerCase(), process.env.ADMIN_EMAIL.toLowerCase())) return Response.json({ error: "The configured admin email does not match." }, { status: 400 });

  try {
    const db = await getDatabase();
    const attempts = await bumpBootstrapAttempts(db, opaqueRateKey(clientAddress));
    if (attempts > 8) return Response.json({ error: "Too many setup attempts. Try again after 15 minutes." }, { status: 429 });
    if (!secureCompare(input.bootstrapSecret, process.env.ADMIN_BOOTSTRAP_SECRET)) return Response.json({ error: "The setup secret is invalid." }, { status: 401 });
    const [admins] = await db.select({ total: count() }).from(user).where(eq(user.role, "admin"));
    if (admins.total > 0) return Response.json({ error: "Initial admin setup is already complete." }, { status: 410 });

    const auth = await getAuth();
    const context = await auth.$context;
    const created = await context.internalAdapter.createUser({
      email: input.email.toLowerCase(), name: input.name, emailVerified: true, image: null,
      role: "admin", banned: false, banReason: null, banExpires: null, twoFactorEnabled: false,
    }, { method: "admin" });
    try {
      const passwordHash = await context.password.hash(input.password);
      await context.internalAdapter.createAccount({ accountId: created.id, providerId: "credential", userId: created.id, password: passwordHash });
      await db.insert(auditEvents).values({ id: randomUUID(), actorId: created.id, action: "admin.provisioned", entityType: "user", entityId: created.id, metadata: {} });
      await db.insert(posts).values(initialDrafts.map((draft) => ({ ...draft, id: randomUUID(), status: "draft" as const, authorId: created.id, tags: draft.tags, publishedAt: null }))).onConflictDoNothing({ target: posts.slug });
    } catch (error) {
      await context.internalAdapter.deleteUser(created.id);
      throw error;
    }
    return Response.json({ ok: true, message: "Admin provisioned. Sign in with the new credential and finish authenticator setup." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") return Response.json({ error: "Initial admin setup is already complete." }, { status: 409 });
    return Response.json({ error: "Admin setup could not be completed. Check the database migration and server logs." }, { status: 503 });
  }
};
