import { signToken } from "../auth/jwt.js";

/** Fixed secret shared by every test that needs to mint or verify a token. */
export const TEST_JWT_SECRET = "test-jwt-secret";

/**
 * Mints a valid bearer token directly (no round-trip through real login),
 * so trades/positions route and WS tests can stay focused on their own
 * behavior — auth is just one more narrow, bypassable seam, same spirit as
 * this repo's `noopBroadcaster`/`noopAuditLogger`.
 */
export function signTestToken(overrides: { id?: string; username?: string } = {}): string {
  return signToken({ id: overrides.id ?? "USR-TEST", username: overrides.username ?? "testuser" }, TEST_JWT_SECRET);
}
