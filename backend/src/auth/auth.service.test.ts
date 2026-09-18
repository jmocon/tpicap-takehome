import { describe, expect, it } from "vitest";
import { AuthService } from "./auth.service.js";
import { hashPassword } from "./password.js";
import { tryVerifyToken } from "./jwt.js";
import type { User } from "./auth.types.js";

const SECRET = "unit-test-secret";

function makeUsersRepository(users: User[]) {
  return {
    findByUsername(username: string) {
      return users.find((user) => user.username === username);
    },
  };
}

describe("AuthService", () => {
  it("logs in a known user with the correct password", () => {
    const user: User = {
      id: "USR-1",
      username: "trader1",
      passwordHash: hashPassword("correct-password"),
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const service = new AuthService(makeUsersRepository([user]), SECRET);

    const result = service.login("trader1", "correct-password");

    expect(result.user).toEqual({ id: "USR-1", username: "trader1" });
    expect(tryVerifyToken(result.token, SECRET)).toEqual({ id: "USR-1", username: "trader1" });
  });

  it("rejects a wrong password with a generic message", () => {
    const user: User = {
      id: "USR-1",
      username: "trader1",
      passwordHash: hashPassword("correct-password"),
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const service = new AuthService(makeUsersRepository([user]), SECRET);

    expect(() => service.login("trader1", "wrong-password")).toThrow(/invalid username or password/i);
  });

  it("rejects an unknown username with the same generic message as a wrong password", () => {
    const service = new AuthService(makeUsersRepository([]), SECRET);

    let unknownUserMessage = "";
    try {
      service.login("nobody", "whatever");
    } catch (err) {
      unknownUserMessage = err instanceof Error ? err.message : "";
    }

    const user: User = {
      id: "USR-1",
      username: "trader1",
      passwordHash: hashPassword("correct-password"),
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const serviceWithUser = new AuthService(makeUsersRepository([user]), SECRET);
    let wrongPasswordMessage = "";
    try {
      serviceWithUser.login("trader1", "wrong-password");
    } catch (err) {
      wrongPasswordMessage = err instanceof Error ? err.message : "";
    }

    expect(unknownUserMessage).toBe(wrongPasswordMessage);
  });
});
