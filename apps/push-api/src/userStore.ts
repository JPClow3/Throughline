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
};

export type SessionRow = {
  token: string;
  userId: string;
  expiresAt: string;
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashAuthKey(authKey: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(authKey, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
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
      recovery_wrapped_dek TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
  
  try { db.exec("ALTER TABLE users ADD COLUMN recovery_hash TEXT"); } catch { /* ignore */ }
  try { db.exec("ALTER TABLE users ADD COLUMN recovery_wrapped_dek TEXT"); } catch { /* ignore */ }
  try { db.exec("ALTER TABLE users ADD COLUMN google_id TEXT"); } catch { /* ignore */ }

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
        id: `user_${randomBytes(12).toString("hex")}`,
        email,
        salt: input.salt,
        authHash: hashAuthKey(input.authKey),
        wrappedDek: input.wrappedDek,
        createdAt: new Date().toISOString()
      };
      
      const recoveryHash = hashAuthKey(input.recoveryAuthKey);
      
      db.prepare(
        "INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, recovery_hash, recovery_wrapped_dek) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, recoveryHash, input.recoveryWrappedDek);
      return row;
    },

    getSalt(email: string): string | null {
      const row = db.prepare("SELECT salt FROM users WHERE email = ?").get(normalizeEmail(email)) as
        | { salt: string }
        | undefined;
      return row?.salt ?? null;
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
      const row: UserRow = {
        id: `user_${randomBytes(12).toString("hex")}`,
        email,
        salt: "", // No salt for google users
        authHash: "", // No auth hash for google users
        wrappedDek: input.dek, // Raw DEK stored for google users
        createdAt: new Date().toISOString(),
        googleId: input.googleId
      };
      
      db.prepare(
        "INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt, input.googleId);
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
      
      return { userId: row.id, dek: row.wrapped_dek };
    },

    createSession(userId: string): string {
      const token = randomBytes(32).toString("hex");
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

    getSessionUser(token: string): { userId: string; email: string } | null {
      const row = db
        .prepare(
          `SELECT u.id AS user_id, u.email AS email, s.expires_at AS expires_at
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = ?`
        )
        .get(token) as { user_id: string; email: string; expires_at: string } | undefined;
      if (!row) {
        return null;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
        return null;
      }
      return { userId: row.user_id, email: row.email };
    },

    updatePassword(userId: string, authKey: string, wrappedDek: string) {
      const authHash = hashAuthKey(authKey);
      db.prepare("UPDATE users SET auth_hash = ?, wrapped_dek = ? WHERE id = ?").run(
        authHash,
        wrappedDek,
        userId
      );
    },

    deleteSession(token: string) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }
  };
}
