import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAuth } from "./auth";

export function secureCompare(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sameOriginJson(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || site === "cross-site") return false;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) return false;
  } catch { return false; }
  return (request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

function parseCookies(request: Request) {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

export function newCsrfToken() { return randomBytes(32).toString("base64url"); }
export function csrfCookieName() { return process.env.NODE_ENV === "production" ? "__Host-admin-csrf" : "admin-csrf"; }
export function csrfSetCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${csrfCookieName()}=${encodeURIComponent(token)}; Path=/; Max-Age=900; HttpOnly; SameSite=Strict${secure}`;
}
export function verifyCsrf(request: Request) {
  const cookie = parseCookies(request)[csrfCookieName()];
  const header = request.headers.get("x-csrf-token");
  return Boolean(cookie && header && secureCompare(cookie, header));
}

export function opaqueRateKey(address: string) {
  const key = process.env.BETTER_AUTH_SECRET ?? "local-only-ephemeral-rate-key";
  return createHmac("sha256", key).update(address || "unknown").digest("hex");
}

export async function adminSession(request: Request, options: { requireMfa?: boolean } = {}) {
  let session: Awaited<ReturnType<Awaited<ReturnType<typeof getAuth>>["api"]["getSession"]>>;
  try {
    const auth = await getAuth();
    session = await auth.api.getSession({ headers: request.headers });
  } catch {
    return { response: Response.json({ error: "Admin authentication is unavailable." }, { status: 503 }) };
  }
  if (!session) return { response: Response.json({ error: "Sign in required." }, { status: 401 }) };
  if (session.user.role !== "admin") return { response: Response.json({ error: "Forbidden." }, { status: 403 }) };
  if (options.requireMfa !== false && !session.user.twoFactorEnabled) {
    return { response: Response.json({ error: "Complete authenticator setup before using the admin." }, { status: 428 }) };
  }
  return { session };
}
