import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { auditEvents } from "../../../db/schema";
import { getDatabase } from "../../../lib/database";
import { adminSession } from "../../../lib/security";

export const GET: APIRoute = async ({ request }) => {
  const access = await adminSession(request);
  if (access.response) return access.response;
  try {
    const events = await (await getDatabase()).select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100);
    return Response.json({ events }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "Audit history unavailable." }, { status: 503 }); }
};
