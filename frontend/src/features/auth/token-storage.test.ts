import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./token-storage";

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
});
