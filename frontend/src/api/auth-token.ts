/**
 * Module-level token accessor, framework-agnostic — `AuthContext` pushes into
 * this on login/logout/restore, and `http-client.ts`/`trades-socket.ts` read
 * from it, so neither has to import React or the auth feature directly.
 */
let currentToken: string | undefined;

export function getAuthToken(): string | undefined {
  return currentToken;
}

export function setAuthToken(token: string | undefined): void {
  currentToken = token;
}

let authFailureHandler: (() => void) | undefined;

/**
 * Registered by `AuthContext` so a token the *server* rejects (an expired or
 * otherwise invalid JWT) ends the session here too. Without this the app keeps
 * rendering as logged-in off a stale `localStorage` entry: every request 401s
 * and the WS reconnect loop is refused on every attempt, with nothing telling
 * the user to log in again.
 */
export function onAuthFailure(handler: (() => void) | undefined): void {
  authFailureHandler = handler;
}

export function notifyAuthFailure(): void {
  authFailureHandler?.();
}
