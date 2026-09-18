import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Salted `scrypt` hashing via `node:crypto` — no extra dependency (e.g.
 * `bcrypt`), consistent with this repo's `node:sqlite`-over-`better-sqlite3`
 * rationale of avoiding native/compiled dependencies where a built-in exists.
 */
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** Stored as `<salt-hex>:<hash-hex>` in a single column. */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const storedHash = Buffer.from(hash, "hex");
  const suppliedHash = scryptSync(password, salt, KEY_LENGTH);

  // Buffers of different lengths would make timingSafeEqual throw rather
  // than just return false, so guard that explicitly.
  if (storedHash.length !== suppliedHash.length) return false;
  return timingSafeEqual(storedHash, suppliedHash);
}
