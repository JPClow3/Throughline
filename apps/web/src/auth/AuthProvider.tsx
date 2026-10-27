import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deriveKeys,
  dekFromB64,
  dekToB64,
  generateDek,
  importDek,
  randomSalt,
  unwrapDek,
  wrapDek,
  deriveRecoveryKeys,
  generateRecoveryKey
} from "./crypto";

const API_BASE = (import.meta.env.VITE_PUSH_API_URL ?? "/api").replace(/\/$/, "");
const EMAIL_KEY = "tl_email";
const DEK_KEY = "tl_dek";
const EMAIL_VERIFIED_KEY = "tl_email_verified";

type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  status: AuthStatus;
  email: string | null;
  emailVerified: boolean | null;
  /** In-memory AES-GCM key for record encryption (null until authed). */
  dekKey: CryptoKey | null;
  signup: (email: string, password: string) => Promise<string>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<{ created: boolean }>;
  rotateRecoveryKey: () => Promise<string>;
  resetPassword: (email: string, recoveryKey: string, newPassword: string) => Promise<void>;
  resendVerification: () => Promise<{ mailSent: boolean }>;
  refreshEmailVerified: () => Promise<void>;
  verifyEmailToken: (token: string) => Promise<{ email: string | null; alreadyVerified: boolean }>;
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

function readLocalVerified(): boolean | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(EMAIL_VERIFIED_KEY);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

function writeLocalVerified(verified: boolean | null) {
  if (typeof localStorage === "undefined") return;
  if (verified === null) {
    localStorage.removeItem(EMAIL_VERIFIED_KEY);
    return;
  }
  localStorage.setItem(EMAIL_VERIFIED_KEY, verified ? "1" : "0");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [dekKey, setDekKey] = useState<CryptoKey | null>(null);

  // Restore session optimistically from the local marker (offline-friendly),
  // then validate against the server when online.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof localStorage === "undefined") {
        if (!cancelled) setStatus("anon");
        return;
      }
      const savedEmail = localStorage.getItem(EMAIL_KEY);
      const savedDek = localStorage.getItem(DEK_KEY);
      if (savedEmail && savedDek) {
        const key = await importDek(dekFromB64(savedDek));
        if (cancelled) return;
        setEmail(savedEmail);
        setDekKey(key);
        setEmailVerified(readLocalVerified());
        setStatus("authed");
        // Background validation; only sign out on a definitive 401.
        try {
          const res = await api("/auth/me");
          if (cancelled) return;
          if (res.status === 401) {
            clearLocal();
            setEmail(null);
            setDekKey(null);
            setEmailVerified(null);
            setStatus("anon");
            return;
          }
          if (res.ok) {
            const me = (await res.json()) as { email?: string; emailVerified?: boolean };
            if (typeof me.emailVerified === "boolean") {
              writeLocalVerified(me.emailVerified);
              setEmailVerified(me.emailVerified);
            }
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
    localStorage.removeItem(EMAIL_VERIFIED_KEY);
  }

  async function persistSession(nextEmail: string, dek: Uint8Array, verified: boolean | null = false) {
    localStorage.setItem(EMAIL_KEY, nextEmail);
    localStorage.setItem(DEK_KEY, dekToB64(dek));
    writeLocalVerified(verified);
    setEmail(nextEmail);
    setDekKey(await importDek(dek));
    setEmailVerified(verified);
    setStatus("authed");
  }

  const signup = useCallback(async (rawEmail: string, password: string): Promise<string> => {
    const userEmail = rawEmail.trim().toLowerCase();
    const salt = randomSalt();
    const { kek, authKey } = await deriveKeys(password, salt);
    const dek = generateDek();
    const wrappedDek = await wrapDek(dek, kek);

    // Generate recovery key
    const recoveryKey = generateRecoveryKey();
    const { kek: recoveryKek, authKey: recoveryAuthKey } = await deriveRecoveryKeys(recoveryKey, salt);
    const recoveryWrappedDek = await wrapDek(dek, recoveryKek);

    const res = await api("/auth/signup", { email: userEmail, salt, authKey, wrappedDek, recoveryAuthKey, recoveryWrappedDek });
    if (res.status === 409) {
      throw new AuthError("An account with that email already exists.");
    }
    if (!res.ok) {
      throw new AuthError("Could not create the account. Please try again.");
    }
    await persistSession(userEmail, dek, false);
    return recoveryKey;
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
    const { wrappedDek, emailVerified: verified } = (await loginRes.json()) as {
      wrappedDek: string;
      emailVerified?: boolean;
    };
    const dek = await unwrapDek(wrappedDek, kek);
    await persistSession(userEmail, dek, verified ?? false);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const freshDek = generateDek();
    const dekStr = dekToB64(freshDek);

    const res = await api("/auth/google", { credential, dek: dekStr });

    if (!res.ok) {
      let msg = "Could not sign in with Google. Please try again.";
      try {
        const err = await res.json();
        if (err.error === "email-taken-by-another-method") {
          msg = "An account with this email already exists using a password.";
        }
      } catch { /* ignore */ }
      throw new AuthError(msg);
    }

    const data = (await res.json()) as { email: string; dek: string; created?: boolean; emailVerified?: boolean };
    const finalDek = dekFromB64(data.dek);
    await persistSession(data.email, finalDek, data.emailVerified ?? true);
    return { created: Boolean(data.created) };
  }, []);

  const rotateRecoveryKey = useCallback(async (): Promise<string> => {
    const savedDek = localStorage.getItem(DEK_KEY);
    if (!savedDek) {
      throw new AuthError("Sign in again before regenerating your recovery key.");
    }

    const res = await api("/auth/me");
    if (!res.ok) {
      throw new AuthError("Sign in again before regenerating your recovery key.");
    }

    const me = (await res.json()) as { email: string };
    const accountEmail = email ?? me.email;
    const saltRes = await api("/auth/salt", { email: accountEmail });
    let salt: string | undefined;
    let provisionSalt = false;
    if (saltRes.ok) {
      const payload = (await saltRes.json()) as { salt?: string };
      salt = payload.salt || undefined;
    }
    if (!salt) {
      salt = randomSalt();
      provisionSalt = true;
    }

    const recoveryKey = generateRecoveryKey();
    const { kek: recoveryKek, authKey: recoveryAuthKey } = await deriveRecoveryKeys(recoveryKey, salt);
    const recoveryWrappedDek = await wrapDek(dekFromB64(savedDek), recoveryKek);
    const updateRes = await api("/auth/update-recovery-key", {
      recoveryAuthKey,
      recoveryWrappedDek,
      ...(provisionSalt ? { salt } : {})
    });
    if (!updateRes.ok) {
      throw new AuthError("Could not update your recovery key.");
    }
    return recoveryKey;
  }, [email]);

  const resetPassword = useCallback(async (rawEmail: string, recoveryKey: string, newPassword: string) => {
    const userEmail = rawEmail.trim().toLowerCase();
    const saltRes = await api("/auth/salt", { email: userEmail });
    if (!saltRes.ok) {
      throw new AuthError("No account found for that email.");
    }
    const { salt } = (await saltRes.json()) as { salt: string };

    const { kek: recoveryKek, authKey: recoveryAuthKey } = await deriveRecoveryKeys(recoveryKey, salt);
    const loginRes = await api("/auth/login", { email: userEmail, authKey: recoveryAuthKey });
    if (loginRes.status === 401) {
      throw new AuthError("Invalid recovery key.");
    }
    if (!loginRes.ok) {
      throw new AuthError("Could not sign in with recovery key.");
    }
    const { wrappedDek, emailVerified: verified } = (await loginRes.json()) as {
      wrappedDek: string;
      emailVerified?: boolean;
    };

    let dek: Uint8Array;
    try {
      dek = await unwrapDek(wrappedDek, recoveryKek);
    } catch {
      throw new AuthError("Failed to decrypt data with that recovery key.");
    }

    const { kek: newKek, authKey: newAuthKey } = await deriveKeys(newPassword, salt);
    const newWrappedDek = await wrapDek(dek, newKek);

    const updateRes = await api("/auth/update-password", { authKey: newAuthKey, wrappedDek: newWrappedDek });
    if (!updateRes.ok) {
      throw new AuthError("Could not update password.");
    }

    await persistSession(userEmail, dek, verified ?? false);
  }, []);

  const refreshEmailVerified = useCallback(async () => {
    try {
      const res = await api("/auth/me");
      if (!res.ok) return;
      const me = (await res.json()) as { emailVerified?: boolean };
      if (typeof me.emailVerified === "boolean") {
        writeLocalVerified(me.emailVerified);
        setEmailVerified(me.emailVerified);
      }
    } catch {
      // ignore offline
    }
  }, []);

  const resendVerification = useCallback(async () => {
    const res = await api("/auth/resend-verification", {});
    if (res.status === 401) {
      throw new AuthError("Sign in again to resend verification.");
    }
    if (!res.ok) {
      throw new AuthError("Could not resend the verification email.");
    }
    const data = (await res.json()) as { emailVerified?: boolean; mailSent?: boolean; alreadyVerified?: boolean };
    if (data.emailVerified || data.alreadyVerified) {
      writeLocalVerified(true);
      setEmailVerified(true);
    }
    return { mailSent: Boolean(data.mailSent) };
  }, []);

  const verifyEmailToken = useCallback(async (token: string) => {
    const res = await api(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      throw new AuthError("This verification link is invalid or expired.");
    }
    const data = (await res.json().catch(() => ({}))) as { email?: string; emailVerified?: boolean; alreadyVerified?: boolean };
    writeLocalVerified(true);
    setEmailVerified(true);
    if (data.email) {
      setEmail(data.email);
    }
    return { email: data.email ?? null, alreadyVerified: Boolean(data.alreadyVerified) };
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
    setEmailVerified(null);
    setStatus("anon");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      email,
      emailVerified,
      dekKey,
      signup,
      login,
      loginWithGoogle,
      rotateRecoveryKey,
      resetPassword,
      resendVerification,
      refreshEmailVerified,
      verifyEmailToken,
      logout
    }),
    [
      status,
      email,
      emailVerified,
      dekKey,
      signup,
      login,
      loginWithGoogle,
      rotateRecoveryKey,
      resetPassword,
      resendVerification,
      refreshEmailVerified,
      verifyEmailToken,
      logout
    ]
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
