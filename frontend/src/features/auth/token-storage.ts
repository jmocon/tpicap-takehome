export interface StoredAuth {
  token: string;
  user: { id: string; username: string };
}

const STORAGE_KEY = "auth";

/**
 * Reads the `exp` claim without verifying the signature — the backend is the
 * only thing that can do that, and it does on every request. The point here is
 * narrower: an already-expired token shouldn't restore a session that looks
 * logged-in but can't talk to the server. A token we can't parse is left to
 * the backend to reject.
 */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

/**
 * Thin wrapper over `localStorage` — every access is wrapped in try/catch
 * since storage can throw or be unavailable (private browsing, quota,
 * disabled cookies/storage), and a login-state hiccup there shouldn't crash
 * the app.
 */
export const tokenStorage = {
  load(): StoredAuth | undefined {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      const stored = JSON.parse(raw) as StoredAuth;
      if (!stored?.token || isExpired(stored.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return undefined;
      }
      return stored;
    } catch {
      return undefined;
    }
  },

  save(auth: StoredAuth): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // ignore — e.g. private-browsing storage restrictions
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
