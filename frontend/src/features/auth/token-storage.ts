export interface StoredAuth {
  token: string;
  user: { id: string; username: string };
}

const STORAGE_KEY = "auth";

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
      return JSON.parse(raw) as StoredAuth;
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
