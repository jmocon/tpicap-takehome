import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./http-client";
import { setAuthToken } from "./auth-token";

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
});
