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
