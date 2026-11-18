import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import { feedback } from "../../../../db/schema";
import { getDatabase } from "../../../../lib/database";
import { adminSession } from "../../../../lib/security";

export const GET: APIRoute = async ({ request }) => {
  const access = await adminSession(request);
  if (access.response) return access.response;
  try {
    const rows = await (await getDatabase()).select().from(feedback).orderBy(desc(feedback.createdAt)).limit(200);
    return Response.json({ feedback: rows }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "Feedback storage unavailable." }, { status: 503 }); }
};
