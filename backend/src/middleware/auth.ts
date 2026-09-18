import type { NextFunction, Request, Response } from "express";
import { tryVerifyToken } from "../auth/jwt.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import { UnauthorizedError } from "../shared/errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const BEARER_PREFIX = "Bearer ";

/**
 * A simple login gate — every authenticated user can do everything, there's
 * no per-user authorization/ownership check here or anywhere downstream.
 */
export function authMiddleware(jwtSecret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    const token = header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;
    if (!token) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const user = tryVerifyToken(token, jwtSecret);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    req.user = user;
    next();
  };
}
