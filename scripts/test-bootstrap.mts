import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = await mkdtemp(join(tmpdir(), "portfolio-bootstrap-test-"));
process.env.PORTFOLIO_DATABASE_DIR = join(dir, "db");
delete process.env.DATABASE_URL;
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_URL = "http://localhost:4321";
const code = randomBytes(32).toString("base64url");
process.env.ADMIN_BOOTSTRAP_HASH = createHash("sha256").update(code).digest("hex");
process.env.ADMIN_BOOTSTRAP_EXPIRES_AT = new Date(Date.now() + 900_000).toISOString();
const { POST } = await import("../src/pages/api/admin/bootstrap");
const { GET } = await import("../src/pages/api/admin/bootstrap-token");
const { getDatabase, closeDatabaseForTests } = await import("../src/lib/database");
const { getAuth } = await import("../src/lib/auth");
const { adminSession } = await import("../src/lib/security");
const { user, account, auditEvents, bootstrapClaim, bootstrapAttempts } = await import("../src/db/schema");
const { eq, sql } = await import("drizzle-orm");
const db = await getDatabase();
const csrf = "csrf-test-token";
const address = "http://localhost:4321";
const input = { email: "owner@example.test", name: "Test Owner", password: "test-only-password-123", capability: code };
function submit(body: unknown = input, headers: Record<string, string> = {}, clientAddress = "test-client") {
  const request = new Request(`${address}/api/admin/bootstrap`, { method: "POST", headers: { origin: address, "content-type": "application/json", cookie: `admin-csrf=${csrf}`, "x-csrf-token": csrf, ...headers }, body: JSON.stringify(body) });
  return POST({ request, clientAddress } as never);
}
function cookie(response: Response) { return response.headers.getSetCookie().map((s) => s.split(";")[0]).join("; "); }
function totp(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, "")) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const mac = createHmac("sha1", key).update(counter).digest(); const offset = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
try {
  const tokenResult = await GET({ cookies: { set() {} } } as never);
  assert.deepEqual(Object.keys(await tokenResult.json()), ["csrfToken"]);
  assert.equal((await submit(input, { origin: "https://attacker.invalid" })).status, 403);
  assert.equal((await submit(input, { "x-csrf-token": "wrong" })).status, 403);
  assert.equal((await submit({ ...input, capability: randomBytes(32).toString("base64url") })).status, 401);
  process.env.ADMIN_BOOTSTRAP_EXPIRES_AT = new Date(Date.now() - 1000).toISOString();
  assert.equal((await submit()).status, 503);
  process.env.ADMIN_BOOTSTRAP_EXPIRES_AT = new Date(Date.now() + 31 * 60_000).toISOString();
  assert.equal((await submit()).status, 503);
  process.env.ADMIN_BOOTSTRAP_EXPIRES_AT = new Date(Date.now() + 900_000).toISOString();
  await db.insert(user).values({ id: "conflict", email: input.email, name: "Conflict" });
  assert.equal((await submit()).status, 503);
  assert.equal((await db.select().from(bootstrapClaim)).length, 0);
  assert.equal((await db.select().from(account)).length, 0);
  assert.equal((await db.select().from(auditEvents)).length, 0);
  await db.delete(user).where(eq(user.id, "conflict"));
  await db.execute(sql.raw("CREATE FUNCTION test_abort_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$"));
  await db.execute(sql.raw("CREATE TRIGGER test_abort_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION test_abort_audit()"));
  assert.equal((await submit()).status, 503);
  assert.equal((await db.select().from(user)).length, 0);
  assert.equal((await db.select().from(account)).length, 0);
  assert.equal((await db.select().from(bootstrapClaim)).length, 0);
  await db.execute(sql.raw("DROP TRIGGER test_abort_audit ON audit_events"));
  await db.execute(sql.raw("DROP FUNCTION test_abort_audit()"));
  await db.insert(user).values({ id: "existing-owner", email: "existing@example.test", name: "Existing Owner", role: "admin" });
  assert.equal((await submit()).status, 503);
  assert.equal((await db.select().from(bootstrapClaim)).length, 0);
  await db.delete(user).where(eq(user.id, "existing-owner"));
  await db.delete(bootstrapAttempts);
  for (let i = 0; i < 8; i++) assert.equal((await submit({ ...input, capability: randomBytes(32).toString("base64url") }, {}, "limited")).status, 401);
  assert.equal((await submit(input, {}, "limited")).status, 429);
  await db.delete(bootstrapAttempts);
  const contenders = await Promise.all([submit(input, {}, "one"), submit({ ...input, email: "other@example.test" }, {}, "two")]);
  assert.deepEqual(contenders.map((r) => r.status).sort(), [201, 410]);
  assert.equal((await submit()).status, 410);
  const owners = await db.select().from(user); assert.equal(owners.length, 1); assert.equal(owners[0].emailVerified, false);
  assert.equal((await db.select().from(account)).length, 1); assert.equal((await db.select().from(auditEvents)).length, 1);
  const auth = await getAuth();
  const call = (path: string, payload: object, cookies = "") => auth.handler(new Request(`${address}/api/auth/${path}`, { method: "POST", headers: { origin: address, "content-type": "application/json", cookie: cookies }, body: JSON.stringify(payload) }));
  const signup = await call("sign-up/email", { name: "Public", email: "public@example.test", password: input.password }); assert.notEqual(signup.status, 200);
  const signIn = await call("sign-in/email", { email: owners[0].email, password: input.password }); assert.equal(signIn.status, 200);
  const sessionCookie = cookie(signIn); assert.ok(sessionCookie);
  const req = (cookies: string) => new Request(`${address}/api/admin/posts`, { headers: { cookie: cookies } });
  assert.equal((await adminSession(req(""))).response?.status, 401);
  assert.equal((await adminSession(req(sessionCookie))).response?.status, 428);
  const enroll = await call("two-factor/enable", { password: input.password, method: "totp" }, sessionCookie); assert.equal(enroll.status, 200);
  const enrollment = await enroll.json(); const secret = new URL(enrollment.totpURI).searchParams.get("secret"); assert.ok(secret);
  const verified = await call("two-factor/verify-totp", { code: totp(secret), trustDevice: false }, sessionCookie); assert.equal(verified.status, 200);
  const verifiedCookie = cookie(verified); assert.ok(verifiedCookie);
  assert.ok((await adminSession(req(verifiedCookie))).session);
  const signOut = await call("sign-out", {}, verifiedCookie); assert.equal(signOut.status, 200);
  const mfaSignIn = await call("sign-in/email", { email: owners[0].email, password: input.password });
  assert.equal(mfaSignIn.status, 200); assert.equal((await mfaSignIn.json()).twoFactorRedirect, true);
  const challengeCookie = cookie(mfaSignIn); assert.equal((await adminSession(req(challengeCookie))).response?.status, 401);
  const challenge = await call("two-factor/verify-totp", { code: totp(secret), trustDevice: false }, challengeCookie);
  assert.equal(challenge.status, 200); const finalCookie = cookie(challenge);
  assert.ok((await adminSession(req(finalCookie))).session);
  await db.update(user).set({ role: "user" }).where(eq(user.id, owners[0].id));
  assert.equal((await adminSession(req(finalCookie))).response?.status, 403);
  console.log("Bootstrap, rollback, race, replay, CSRF, signup, login, MFA and authorization checks passed.");
} finally {
  await closeDatabaseForTests();
  await rm(dir, { recursive: true, force: true });
}

process.exit(0);
