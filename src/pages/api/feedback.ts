import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { feedback, feedbackRateLimits } from "../../db/schema";
import { getDatabase } from "../../lib/database";
import { opaqueRateKey, sameOriginJson } from "../../lib/security";

const inputSchema = z.object({
  message: z.string().trim().min(8).max(2000),
  category: z.enum(["general", "bug", "accessibility", "content"]).default("general"),
  website: z.string().max(0).optional().default(""),
}).strict();

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!sameOriginJson(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 5000) return Response.json({ error: "Request too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Please enter a short feedback note.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return Response.json({ error: "Request rejected." }, { status: 400 });

  try {
    const db = await getDatabase();
    const keyHash = opaqueRateKey(clientAddress);
    const now = new Date();
    const [limit] = await db.insert(feedbackRateLimits).values({ keyHash, windowStartedAt: now, count: 1 }).onConflictDoUpdate({
      target: feedbackRateLimits.keyHash,
      set: {
        count: sql`CASE WHEN ${feedbackRateLimits.windowStartedAt} < now() - interval '1 hour' THEN 1 ELSE ${feedbackRateLimits.count} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${feedbackRateLimits.windowStartedAt} < now() - interval '1 hour' THEN now() ELSE ${feedbackRateLimits.windowStartedAt} END`,
      },
    }).returning({ count: feedbackRateLimits.count });
    if (limit.count > 3) return Response.json({ error: "Feedback limit reached. Please try again later." }, { status: 429 });
    const [saved] = await db.insert(feedback).values({ id: randomUUID(), message: parsed.data.message, category: parsed.data.category }).returning({ id: feedback.id, createdAt: feedback.createdAt });
    return Response.json({ ok: true, receivedAt: saved.createdAt }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Feedback storage is not available right now. Please try again later." }, { status: 503 });
  }
};
