import type { APIRoute } from "astro";
import { adminSession, csrfCookieName, newCsrfToken } from "../../../lib/security";

export const GET: APIRoute = async ({ request, cookies }) => {
  const auth = await adminSession(request);
  if (auth.response) return auth.response;
  const token = newCsrfToken();
  cookies.set(csrfCookieName(), token, { path: "/", sameSite: "strict", httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 900 });
  return Response.json({ csrfToken: token }, { headers: { "Cache-Control": "no-store" } });
};
