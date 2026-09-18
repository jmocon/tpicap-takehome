import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "./auth.types.js";

/** A simple login gate, not per-user authorization — see auth.service.ts. */
const TOKEN_EXPIRY = "8h";

interface TokenPayload {
  sub: string;
  username: string;
}

export function signToken(user: AuthenticatedUser, secret: string): string {
  const payload: TokenPayload = { sub: user.id, username: user.username };
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRY });
}

/** Throws on a missing/tampered/expired token — see `tryVerifyToken` for a non-throwing variant. */
export function verifyToken(token: string, secret: string): AuthenticatedUser {
  const payload = jwt.verify(token, secret) as TokenPayload;
  return { id: payload.sub, username: payload.username };
}

/** Non-throwing variant for call sites (middleware, the WS upgrade path) that just need a yes/no. */
export function tryVerifyToken(token: string, secret: string): AuthenticatedUser | undefined {
  try {
    return verifyToken(token, secret);
  } catch {
    return undefined;
  }
}
