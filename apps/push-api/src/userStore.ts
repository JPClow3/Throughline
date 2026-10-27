import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type UserRow = {
  id: string;
  email: string;
  salt: string;
  authHash: string;
  wrappedDek: string;
  createdAt: string;
  googleId?: string;
  emailVerifiedAt?: string | null;
};

export type SessionRow = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type SessionUser = {
  userId: string;
  email: string;
  emailVerified: boolean;
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EMAIL_VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function hashAuthKey(authKey: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(authKey, salt, 64);
  return `${Buffer.from(salt).toString("hex")}:${Buffer.from(derived).toString("hex")}`;
}

function verifyAuthKey(authKey: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const derived = scryptSync(authKey, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export type UserStore = ReturnType<typeof createUserStore>;

/**
 * SQLite-backed user + session store (Node's built-in node:sqlite — no native dep).
 * The DB also holds the sync `records` table (added by the sync module).
 */
export function createUserStore(dbPath: string) {
  try {
    mkdirSync(dirname(dbPath), { recursive: true });
  } catch {
    // Ignore, let sqlite throw if it still fails
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      salt TEXT NOT NULL,
      auth_hash TEXT NOT NULL,
      wrapped_dek TEXT NOT NULL,
      created_at TEXT NOT NULL,
      recovery_hash TEXT,
      recovery_wrapped_dek TEXT,
      google_id TEXT,
      email_verified_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
  `);

  try { db.exec("ALTER TABLE users ADD COLUMN recovery_hash TEXT"); } catch { /* ignore */ }
  try { db.exec("ALTER TABLE users ADD COLUMN recovery_wrapped_dek TEXT"); } catch { /* ignore */ }
  try { db.exec("ALTER TABLE users ADD COLUMN google_id TEXT"); } catch { /* ignore */ }
  try { db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT"); } catch { /* ignore */ }

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  return {
    db,

    createUser(input: { email: string; salt: string; authKey: string; wrappedDek: string; recoveryAuthKey: string; recoveryWrappedDek: string }): UserRow | null {
      const email = normalizeEmail(input.email);
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return null; // email already taken
      }
      const row: UserRow = {
        id: `user_${Buffer.from(randomBytes(12)).toString("hex")}`,
        email,
        salt: input.salt,
        authHash: hashAuthKey(input.authKey),
        wrappedDek: input.wrappedDek,
        createdAt: new Date().toISOString(),
        emailVerifiedAt: null
      };

      const recoveryHash = hashAuthKey(input.recoveryAuthKey);

      db.prepare(
        "INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, recovery_hash, recovery_wrapped_dek, email_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, recoveryHash, input.recoveryWrappedDek, null);
      return row;
    },

    getSalt(email: string): string | null {
      const row = db.prepare("SELECT salt FROM users WHERE email = ?").get(normalizeEmail(email)) as
        | { salt: string }
        | undefined;
      // Empty string is used for legacy Google users that never received a salt.
      return row?.salt ? row.salt : null;
    },

    ensureSalt(userId: string, salt: string) {
      const row = db.prepare("SELECT salt FROM users WHERE id = ?").get(userId) as { salt?: string } | undefined;
      if (!row || row.salt) {
        return;
      }
      db.prepare("UPDATE users SET salt = ? WHERE id = ? AND (salt IS NULL OR salt = '')").run(salt, userId);
    },

    verifyLogin(email: string, authKey: string): { userId: string; salt: string; wrappedDek: string } | null {
      const row = db.prepare("SELECT id, salt, auth_hash, wrapped_dek, recovery_hash, recovery_wrapped_dek FROM users WHERE email = ?").get(
        normalizeEmail(email)
      ) as { id: string; salt: string; auth_hash: string; wrapped_dek: string; recovery_hash?: string; recovery_wrapped_dek?: string } | undefined;

      if (!row) return null;

      if (verifyAuthKey(authKey, row.auth_hash)) {
        return { userId: row.id, salt: row.salt, wrappedDek: row.wrapped_dek };
      }

      if (row.recovery_hash && row.recovery_wrapped_dek && verifyAuthKey(authKey, row.recovery_hash)) {
        return { userId: row.id, salt: row.salt, wrappedDek: row.recovery_wrapped_dek };
      }

      return null;
    },

    createGoogleUser(input: { email: string; googleId: string; dek: string }): UserRow | null {
      const email = normalizeEmail(input.email);
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return null; // email already taken
      }
      const verifiedAt = new Date().toISOString();
      const row: UserRow = {
        id: `user_${Buffer.from(randomBytes(12)).toString("hex")}`,
        email,
        // Salt enables recovery-key derivation even when Google is the login method.
        salt: Buffer.from(randomBytes(16)).toString("base64"),
        authHash: "", // No auth hash for google users
        wrappedDek: input.dek, // Raw DEK stored for google users
        createdAt: new Date().toISOString(),
        googleId: input.googleId,
        emailVerifiedAt: verifiedAt
      };

      db.prepare(
        "INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, google_id, email_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, input.googleId, verifiedAt);
      return row;
    },

    verifyGoogleLogin(email: string, googleId: string): { userId: string; dek: string } | null {
      const row = db.prepare("SELECT id, wrapped_dek, email FROM users WHERE google_id = ?").get(
        googleId
      ) as { id: string; wrapped_dek: string; email: string } | undefined;

      if (!row) return null;

      const normalizedEmail = normalizeEmail(email);
      if (row.email !== normalizedEmail) {
        try {
          db.prepare("UPDATE users SET email = ? WHERE id = ?").run(normalizedEmail, row.id);
        } catch { /* ignore unique constraint failures */ }
      }

      // Google already verified the address — backfill for legacy rows.
      db.prepare(
        "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?"
      ).run(new Date().toISOString(), row.id);

      return { userId: row.id, dek: row.wrapped_dek };
    },

    createSession(userId: string): string {
      const token = Buffer.from(randomBytes(32)).toString("hex");
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);
      db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
        token,
        userId,
        createdAt.toISOString(),
        expiresAt.toISOString()
      );
      return token;
    },

    getSessionUser(token: string): SessionUser | null {
      const row = db
        .prepare(
          `SELECT u.id AS user_id, u.email AS email, u.email_verified_at AS email_verified_at, s.expires_at AS expires_at
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = ?`
        )
        .get(token) as { user_id: string; email: string; email_verified_at: string | null; expires_at: string } | undefined;
      if (!row) {
        return null;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
        return null;
      }
      return {
        userId: row.user_id,
        email: row.email,
        emailVerified: Boolean(row.email_verified_at)
      };
    },

    createEmailVerificationToken(userId: string): string {
      db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(userId);
      const token = Buffer.from(randomBytes(32)).toString("hex");
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + EMAIL_VERIFICATION_TTL_MS);
      db.prepare(
        "INSERT INTO email_verification_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
      ).run(token, userId, expiresAt.toISOString(), createdAt.toISOString());
      return token;
    },

    verifyEmailWithToken(token: string): { userId: string; email: string } | null {
      const row = db
        .prepare(
          `SELECT t.user_id AS user_id, t.expires_at AS expires_at, u.email AS email
           FROM email_verification_tokens t
           JOIN users u ON u.id = t.user_id
           WHERE t.token = ?`
        )
        .get(token) as { user_id: string; expires_at: string; email: string } | undefined;
      if (!row) {
        return null;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        db.prepare("DELETE FROM email_verification_tokens WHERE token = ?").run(token);
        return null;
      }
      const verifiedAt = new Date().toISOString();
      db.prepare("UPDATE users SET email_verified_at = ? WHERE id = ?").run(verifiedAt, row.user_id);
      db.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(row.user_id);
      return { userId: row.user_id, email: row.email };
    },

    isEmailVerified(userId: string): boolean {
      const row = db.prepare("SELECT email_verified_at FROM users WHERE id = ?").get(userId) as
        | { email_verified_at: string | null }
        | undefined;
      return Boolean(row?.email_verified_at);
    },

    updatePassword(userId: string, authKey: string, wrappedDek: string) {
      const authHash = hashAuthKey(authKey);
      db.prepare("UPDATE users SET auth_hash = ?, wrapped_dek = ? WHERE id = ?").run(
        authHash,
        wrappedDek,
        userId
      );
    },

    updateRecoveryKey(userId: string, recoveryAuthKey: string, recoveryWrappedDek: string) {
      const recoveryHash = hashAuthKey(recoveryAuthKey);
      db.prepare("UPDATE users SET recovery_hash = ?, recovery_wrapped_dek = ? WHERE id = ?").run(
        recoveryHash,
        recoveryWrappedDek,
        userId
      );
    },

    deleteSession(token: string) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }
  };
}
