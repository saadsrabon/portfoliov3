// Only a SHA-256 digest is configured on the server; the 32-byte random code is
// handed to the owner out of band. Reject malformed and long-lived configurations.
export function bootstrapConfiguration() {
  const hash = process.env.ADMIN_BOOTSTRAP_HASH ?? "";
  const expiry = process.env.ADMIN_BOOTSTRAP_EXPIRES_AT ?? "";
  if (!/^[a-f0-9]{64}$/.test(hash) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(expiry)) return null;
  const expiresAt = new Date(expiry);
  const remaining = expiresAt.getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 30 * 60 * 1000 || expiresAt.toISOString() !== expiry) return null;
  return { hash, expiresAt };
}
