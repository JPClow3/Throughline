-- Email verification catch-up for D1 databases that applied a pre-verify 0001.
-- Current 0001_initial.sql already creates users.email_verified_at and
-- email_verification_tokens. SQLite has no ADD COLUMN IF NOT EXISTS, so this
-- file only creates the tokens table idempotently. For a legacy D1 that is
-- missing the column, call ensureD1EmailVerificationSchema(db) before using
-- D1UserStore (production Workers use Hyperdrive/Postgres instead).

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);
