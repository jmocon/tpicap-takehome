import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password", () => {
  it("verifies a password against its own hash", () => {
    const hash = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("correct-horse-battery-staple");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash for the same password on each call (random salt)", () => {
    const first = hashPassword("same-password");
    const second = hashPassword("same-password");
    expect(first).not.toBe(second);
    expect(verifyPassword("same-password", first)).toBe(true);
    expect(verifyPassword("same-password", second)).toBe(true);
  });

  it("returns false (not throw) for a malformed stored hash", () => {
    expect(verifyPassword("anything", "not-a-valid-stored-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});
