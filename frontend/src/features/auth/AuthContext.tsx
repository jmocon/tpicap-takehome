import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthFailure, setAuthToken } from "../../api/auth-token";
import { authApi } from "./auth-api";
import { tokenStorage, type StoredAuth } from "./token-storage";

interface AuthContextValue {
  user: StoredAuth["user"] | undefined;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Restores a persisted session (if any) and pushes its token into the
 * module-level accessor *before* first render's effects run — using a lazy
 * `useState` initializer rather than an effect matters here, since an effect
 * would run after descendants' own mount effects (e.g. the trade blotter's
 * initial fetch), sending that first request out without a token.
 */
function initialAuth(): StoredAuth | undefined {
  const stored = tokenStorage.load();
  if (stored) setAuthToken(stored.token);
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | undefined>(initialAuth);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    const next: StoredAuth = { token: result.token, user: result.user };
    setAuthToken(next.token);
    tokenStorage.save(next);
    setAuth(next);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(undefined);
    tokenStorage.clear();
    setAuth(undefined);
  }, []);

  // A token the server rejects (expired, or signed with a since-changed
  // secret) ends the session for real, so the user lands back on /login
  // instead of a shell that 401s every request and gets its WS refused.
  useEffect(() => {
    onAuthFailure(logout);
    return () => onAuthFailure(undefined);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: auth?.user, login, logout }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Deliberately co-located with the provider rather than split into its own
// file. oxlint's only-export-components rule wants a module to export
// components alone, because Vite's Fast Refresh falls back to a full reload
// for a module that mixes them — a dev-time cost, not a runtime one. Keeping
// a context's provider and its consumer hook together is the clearer
// arrangement for a reader, and it's the only pairing in the codebase, so
// the trade is a rare full reload when editing this one file.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
