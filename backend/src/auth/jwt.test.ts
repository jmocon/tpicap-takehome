import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { signToken, tryVerifyToken, verifyToken } from "./jwt.js";

const SECRET = "unit-test-secret";
const USER = { id: "USR-1", username: "trader1" };

describe("jwt", () => {
  it("round-trips a signed token back to the same user", () => {
    const token = signToken(USER, SECRET);
    expect(verifyToken(token, SECRET)).toEqual(USER);
  });

  it("throws on a token signed with a different secret", () => {
    const token = signToken(USER, "a-different-secret");
    expect(() => verifyToken(token, SECRET)).toThrow();
  });

  it("throws on a tampered token", () => {
    const token = signToken(USER, SECRET);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(() => verifyToken(tampered, SECRET)).toThrow();
  });

  it("throws on an expired token", () => {
    const expired = jwt.sign({ sub: USER.id, username: USER.username }, SECRET, { expiresIn: -1 });
    expect(() => verifyToken(expired, SECRET)).toThrow();
  });

  it("tryVerifyToken returns undefined instead of throwing for an invalid token", () => {
    expect(tryVerifyToken("garbage", SECRET)).toBeUndefined();
  });

  it("tryVerifyToken returns the user for a valid token", () => {
    const token = signToken(USER, SECRET);
    expect(tryVerifyToken(token, SECRET)).toEqual(USER);
  });
});
