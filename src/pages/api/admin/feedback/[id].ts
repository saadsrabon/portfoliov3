import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auditEvents, feedback } from "../../../../db/schema";
import { getDatabase } from "../../../../lib/database";
import { adminSession, sameOriginJson, verifyCsrf } from "../../../../lib/security";

export const PATCH: APIRoute = async ({ request, params }) => {
  if (!sameOriginJson(request) || !verifyCsrf(request)) return Response.json({ error: "Request rejected." }, { status: 403 });
  const access = await adminSession(request);
  if (access.response) return access.response;
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !["new", "reviewed", "archived"].includes((body as { status?: string }).status ?? "")) return Response.json({ error: "Choose a valid feedback state." }, { status: 400 });
  const status = (body as { status: "new" | "reviewed" | "archived" }).status;
  const db = await getDatabase();
  const [previous] = await db.select({ id: feedback.id, status: feedback.status }).from(feedback).where(eq(feedback.id, params.id!)).limit(1);
  if (!previous) return Response.json({ error: "Feedback not found." }, { status: 404 });
  const [row] = await db.update(feedback).set({ status }).where(eq(feedback.id, previous.id)).returning();
  await db.insert(auditEvents).values({ id: randomUUID(), actorId: access.session.user.id, action: `feedback.${previous.status}-to-${status}`, entityType: "feedback", entityId: previous.id, metadata: { previousStatus: previous.status, status } });
  return Response.json({ feedback: row }, { headers: { "Cache-Control": "private, no-store" } });
};
