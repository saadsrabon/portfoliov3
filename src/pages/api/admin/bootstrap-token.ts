import type { APIRoute } from "astro";
import { count, eq } from "drizzle-orm";
import { getDatabase } from "../../../lib/database";
import { user } from "../../../db/schema";
import { csrfCookieName, newCsrfToken } from "../../../lib/security";

export const GET: APIRoute = async ({ cookies }) => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_BOOTSTRAP_SECRET) {
    return Response.json({ error: "First-admin setup is not configured." }, { status: 503 });
  }
  try {
    const db = await getDatabase();
    const [admins] = await db.select({ total: count() }).from(user).where(eq(user.role, "admin"));
    if (admins.total > 0) return Response.json({ error: "Initial admin setup is already complete." }, { status: 410 });
    const token = newCsrfToken();
    cookies.set(csrfCookieName(), token, { path: "/", sameSite: "strict", httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 900 });
    return Response.json({ csrfToken: token, email: process.env.ADMIN_EMAIL }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Database is unavailable. Apply the database migration before setup." }, { status: 503 });
  }
};
