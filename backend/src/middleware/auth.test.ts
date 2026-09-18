import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authMiddleware } from "./auth.js";
import { UnauthorizedError } from "../shared/errors.js";
import { signTestToken, TEST_JWT_SECRET } from "../test-support/auth-test-support.js";

function makeRequest(headers: Record<string, string> = {}): Request {
  return {
    header: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

describe("authMiddleware", () => {
  const middleware = authMiddleware(TEST_JWT_SECRET);

  it("calls next() and attaches req.user for a valid token", () => {
    const token = signTestToken({ id: "USR-1", username: "trader1" });
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, {} as Response, next);

    expect(req.user).toEqual({ id: "USR-1", username: "trader1" });
    expect(next).toHaveBeenCalledWith();
  });

  it("throws UnauthorizedError when the Authorization header is missing", () => {
    const req = makeRequest();
    const next = vi.fn() as unknown as NextFunction;

    expect(() => middleware(req, {} as Response, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError when the header doesn't use the Bearer scheme", () => {
    const token = signTestToken();
    const req = makeRequest({ authorization: token });
    const next = vi.fn() as unknown as NextFunction;

    expect(() => middleware(req, {} as Response, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError for a garbage/invalid token", () => {
    const req = makeRequest({ authorization: "Bearer not-a-real-token" });
    const next = vi.fn() as unknown as NextFunction;

    expect(() => middleware(req, {} as Response, next)).toThrow(UnauthorizedError);
    expect(next).not.toHaveBeenCalled();
  });
});
