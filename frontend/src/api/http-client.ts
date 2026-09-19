import { getAuthToken, notifyAuthFailure } from "./auth-token";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

/** A 401 here means "wrong password", not "your session ended" — see below. */
const LOGIN_PATH = "/auth/login";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    // The server is the authority on whether our token is still good; when it
    // says no, end the session here rather than leaving a logged-in-looking UI
    // that fails every request.
    if (res.status === 401 && path !== LOGIN_PATH) notifyAuthFailure();
    throw new ApiError(body?.error?.message ?? res.statusText, res.status, body?.error?.details);
  }

  return body.data as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};
