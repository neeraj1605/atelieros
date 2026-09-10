-- Planex AI — D1 schema (Ideate stage)
-- Apply with:
--   wrangler d1 execute planex-ai --local  --file=./migrations/0001_init.sql
--   wrangler d1 execute planex-ai --remote --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,           -- anonymous project UUID
  token_hash    TEXT NOT NULL,              -- hash of the last issued token
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER,
  turnstile_ok  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  role         TEXT NOT NULL,               -- user | assistant | system
  content      TEXT,
  attachments  TEXT,                        -- JSON array of {kind,mime,name,bytes}
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS context_versions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT NOT NULL,
  version       INTEGER NOT NULL,
  context_json  TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'ai', -- ai | user
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_context_session
  ON context_versions (session_id, version);

CREATE TABLE IF NOT EXISTS usage_counters (
  day     TEXT PRIMARY KEY,                 -- YYYY-MM-DD
  turns   INTEGER NOT NULL DEFAULT 0,
  tokens  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL,
  kind        TEXT NOT NULL,                -- proposal.apply | context.revert | context.edit
  detail      TEXT,                          -- JSON
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_session
  ON audit_log (session_id, created_at);
