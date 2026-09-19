import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./token-storage";

/** A structurally valid JWT (unsigned — only the `exp` claim is read here). */
function jwtExpiringAt(epochMs: number): string {
  const payload = btoa(JSON.stringify({ sub: "USR-1", exp: Math.floor(epochMs / 1000) }));
  return `header.${payload}.signature`;
}

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns undefined when nothing is stored", () => {
    expect(tokenStorage.load()).toBeUndefined();
  });

  it("round-trips a save/load", () => {
    tokenStorage.save({ token: "abc123", user: { id: "USR-1", username: "trader1" } });
    expect(tokenStorage.load()).toEqual({ token: "abc123", user: { id: "USR-1", username: "trader1" } });
  });

  it("clear() removes what was saved", () => {
    tokenStorage.save({ token: "abc123", user: { id: "USR-1", username: "trader1" } });
    tokenStorage.clear();
    expect(tokenStorage.load()).toBeUndefined();
  });

  it("returns undefined (not throw) for corrupted stored JSON", () => {
    localStorage.setItem("auth", "{not-valid-json");
    expect(tokenStorage.load()).toBeUndefined();
  });

  it("discards a stored token whose exp has passed", () => {
    tokenStorage.save({ token: jwtExpiringAt(Date.now() - 1000), user: { id: "USR-1", username: "trader1" } });
    expect(tokenStorage.load()).toBeUndefined();
    expect(localStorage.getItem("auth")).toBeNull();
  });

  it("keeps a stored token that is still within its exp", () => {
    const token = jwtExpiringAt(Date.now() + 60_000);
    tokenStorage.save({ token, user: { id: "USR-1", username: "trader1" } });
    expect(tokenStorage.load()?.token).toBe(token);
  });
});
