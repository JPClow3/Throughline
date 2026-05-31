import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deriveKeys,
  dekFromB64,
  dekToB64,
  generateDek,
  importDek,
  randomSalt,
  unwrapDek,
  wrapDek
} from "./crypto";

const API_BASE = (import.meta.env.VITE_PUSH_API_URL ?? "/api").replace(/\/$/, "");
const EMAIL_KEY = "tl_email";
const DEK_KEY = "tl_dek";

type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  status: AuthStatus;
  email: string | null;
  /** In-memory AES-GCM key for record encryption (null until authed). */
  dekKey: CryptoKey | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

class AuthError extends Error {}

async function api(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [dekKey, setDekKey] = useState<CryptoKey | null>(null);

  // Restore session optimistically from the local marker (offline-friendly),
  // then validate against the server when online.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedEmail = localStorage.getItem(EMAIL_KEY);
      const savedDek = localStorage.getItem(DEK_KEY);
      if (savedEmail && savedDek) {
        const key = await importDek(dekFromB64(savedDek));
        if (cancelled) return;
        setEmail(savedEmail);
        setDekKey(key);
        setStatus("authed");
        // Background validation; only sign out on a definitive 401.
        try {
          const res = await api("/auth/me");
          if (!cancelled && res.status === 401) {
            clearLocal();
            setEmail(null);
            setDekKey(null);
            setStatus("anon");
          }
        } catch {
          // offline — stay optimistically authed
        }
        return;
      }
      if (!cancelled) setStatus("anon");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function clearLocal() {
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(DEK_KEY);
  }

  async function persistSession(nextEmail: string, dek: Uint8Array) {
    localStorage.setItem(EMAIL_KEY, nextEmail);
    localStorage.setItem(DEK_KEY, dekToB64(dek));
    setEmail(nextEmail);
    setDekKey(await importDek(dek));
    setStatus("authed");
  }

  const signup = useCallback(async (rawEmail: string, password: string) => {
    const userEmail = rawEmail.trim().toLowerCase();
    const salt = randomSalt();
    const { kek, authKey } = await deriveKeys(password, salt);
    const dek = generateDek();
    const wrappedDek = await wrapDek(dek, kek);
    const res = await api("/auth/signup", { email: userEmail, salt, authKey, wrappedDek });
    if (res.status === 409) {
      throw new AuthError("An account with that email already exists.");
    }
    if (!res.ok) {
      throw new AuthError("Could not create the account. Please try again.");
    }
    await persistSession(userEmail, dek);
  }, []);

  const login = useCallback(async (rawEmail: string, password: string) => {
    const userEmail = rawEmail.trim().toLowerCase();
    const saltRes = await api("/auth/salt", { email: userEmail });
    if (saltRes.status === 404) {
      throw new AuthError("No account found for that email.");
    }
    if (!saltRes.ok) {
      throw new AuthError("Could not reach the server. Please try again.");
    }
    const { salt } = (await saltRes.json()) as { salt: string };
    const { kek, authKey } = await deriveKeys(password, salt);
    const loginRes = await api("/auth/login", { email: userEmail, authKey });
    if (loginRes.status === 401) {
      throw new AuthError("That email and password don't match.");
    }
    if (!loginRes.ok) {
      throw new AuthError("Could not sign in. Please try again.");
    }
    const { wrappedDek } = (await loginRes.json()) as { wrappedDek: string };
    const dek = await unwrapDek(wrappedDek, kek);
    await persistSession(userEmail, dek);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", {});
    } catch {
      // ignore network errors on logout
    }
    clearLocal();
    setEmail(null);
    setDekKey(null);
    setStatus("anon");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, email, dekKey, signup, login, logout }),
    [status, email, dekKey, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
