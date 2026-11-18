import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, twoFactor } from "better-auth/plugins";
import * as schema from "../db/schema";
import { getDatabase } from "./database";

export function createAuth(db: unknown, options: { secret: string; baseURL: string; production?: boolean }) {
  return betterAuth({
    appName: "Saad Portfolio",
    baseURL: options.baseURL,
    secret: options.secret,
    trustedOrigins: [options.baseURL],
    database: drizzleAdapter(db as never, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
    },
    plugins: [
      admin({ defaultRole: "user", adminRoles: ["admin"] }),
      twoFactor({ issuer: "Saad Portfolio", maxFailedAttempts: 5, durationSeconds: 900 }),
    ],
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 3600, max: 1 },
        "/two-factor/verify-totp": { window: 60, max: 5 },
      },
    },
    session: { expiresIn: 8 * 60 * 60, updateAge: 30 * 60, cookieCache: { enabled: false } },
    advanced: {
      useSecureCookies: Boolean(options.production),
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"], disableIpTracking: true },
      defaultCookieAttributes: { httpOnly: true, secure: Boolean(options.production), sameSite: "lax" },
    },
  });
}

let authPromise: Promise<ReturnType<typeof createAuth>> | undefined;
export async function getAuth() {
  authPromise ??= (async () => {
    const db = await getDatabase();
    const production = process.env.NODE_ENV === "production";
    const secret = process.env.BETTER_AUTH_SECRET ?? (production ? "" : randomBytes(32).toString("base64url"));
    if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
    const baseURL = process.env.BETTER_AUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4321");
    return createAuth(db, { secret, baseURL, production });
  })();
  return authPromise;
}

export function resetAuthForTests() { authPromise = undefined; }
