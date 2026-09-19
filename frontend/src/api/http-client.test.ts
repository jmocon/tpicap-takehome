import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./http-client";
import { onAuthFailure, setAuthToken } from "./auth-token";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "",
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("httpClient", () => {
  beforeEach(() => {
    setAuthToken(undefined);
    onAuthFailure(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not attach an Authorization header when no token is set", async () => {
    const fetchMock = mockFetchOnce({ data: { ok: true } });

    await httpClient.get("/health");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("attaches a Bearer Authorization header when a token is set", async () => {
    setAuthToken("test-token");
    const fetchMock = mockFetchOnce({ data: { ok: true } });

    await httpClient.get("/trades");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  });

  it("ends the session when the server rejects the token with a 401", async () => {
    const onFailure = vi.fn();
    onAuthFailure(onFailure);
    mockFetchOnce({ error: { message: "Invalid or expired token" } }, false, 401);

    await expect(httpClient.get("/trades")).rejects.toThrow("Invalid or expired token");
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it("does not end the session when a login attempt is rejected", async () => {
    const onFailure = vi.fn();
    onAuthFailure(onFailure);
    mockFetchOnce({ error: { message: "Invalid username or password" } }, false, 401);

    await expect(httpClient.post("/auth/login", { username: "x", password: "y" })).rejects.toThrow();
    expect(onFailure).not.toHaveBeenCalled();
  });
});
