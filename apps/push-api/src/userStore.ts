import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type UserRow = {
  id: string;
  email: string;
  salt: string;
  authHash: string;
  wrappedDek: string;
  createdAt: string;
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
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      salt TEXT NOT NULL,
      auth_hash TEXT NOT NULL,
      wrapped_dek TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  return {
    db,

    createUser(input: { email: string; salt: string; authKey: string; wrappedDek: string }): UserRow | null {
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
      db.prepare(
        "INSERT INTO users (id, email, salt, auth_hash, wrapped_dek, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(row.id, row.email, row.salt, row.authHash, row.wrappedDek, row.createdAt);
      return row;
    },

    getSalt(email: string): string | null {
      const row = db.prepare("SELECT salt FROM users WHERE email = ?").get(normalizeEmail(email)) as
        | { salt: string }
        | undefined;
      return row?.salt ?? null;
    },

    verifyLogin(email: string, authKey: string): { userId: string; salt: string; wrappedDek: string } | null {
      const row = db.prepare("SELECT id, salt, auth_hash, wrapped_dek FROM users WHERE email = ?").get(
        normalizeEmail(email)
      ) as { id: string; salt: string; auth_hash: string; wrapped_dek: string } | undefined;
      if (!row || !verifyAuthKey(authKey, row.auth_hash)) {
        return null;
      }
      return { userId: row.id, salt: row.salt, wrappedDek: row.wrapped_dek };
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

    deleteSession(token: string) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }
  };
}
