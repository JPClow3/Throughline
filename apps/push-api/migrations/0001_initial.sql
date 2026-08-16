-- Throughline Initial Schema for Cloudflare D1 (SQLite)

-- Users table (supports E2EE key derivation and optional Google auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  auth_hash TEXT NOT NULL,
  wrapped_dek TEXT NOT NULL,
  created_at TEXT NOT NULL,
  recovery_hash TEXT,
  recovery_wrapped_dek TEXT,
  google_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- User sessions table
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Encrypted sync records (E2EE ciphertext only, server cannot read content)
CREATE TABLE IF NOT EXISTS records (
  user_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  id TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  ciphertext TEXT,
  iv TEXT,
  PRIMARY KEY (user_id, entity, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_records_user_changed ON records(user_id, changed_at);

-- Web Push subscriptions (redacted metadata only)
CREATE TABLE IF NOT EXISTS subscriptions (
  endpoint_hash TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  expiration_time INTEGER,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

-- Redacted reminders for push dispatch
CREATE TABLE IF NOT EXISTS reminders (
  endpoint_hash TEXT NOT NULL,
  reminder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notify_at TEXT NOT NULL,
  urgency TEXT NOT NULL,
  task_id TEXT NOT NULL,
  dispatched_at TEXT,
  PRIMARY KEY (endpoint_hash, reminder_id),
  FOREIGN KEY (endpoint_hash) REFERENCES subscriptions(endpoint_hash) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(notify_at, dispatched_at);
CREATE INDEX IF NOT EXISTS idx_reminders_endpoint ON reminders(endpoint_hash);
