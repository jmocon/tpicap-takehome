-- Canonical schema for the trade blotter, for inspection without running the app.
--
-- This mirrors the applied result of backend/src/db/migrations/*.sql, which is
-- the source of truth — the running app builds its schema by applying those
-- numbered migration files in order, never by executing this file. Keep the two
-- in sync when adding a migration.
--
-- Engine: SQLite (via Node's built-in `node:sqlite`). Timestamps are ISO-8601
-- strings rather than SQLite's DATETIME, so they round-trip to JSON unchanged.

-- ---------------------------------------------------------------------------
-- 001_init.sql — the core trade record
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price REAL NOT NULL CHECK (price > 0),
  trader TEXT NOT NULL,
  book TEXT,
  counterparty TEXT,
  trade_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- The three columns the blotter filters on.
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
CREATE INDEX IF NOT EXISTS idx_trades_trader ON trades (trader);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);

-- ---------------------------------------------------------------------------
-- 002_audit_log.sql — amendment/cancellation history (bonus: audit trail)
-- ---------------------------------------------------------------------------
--
-- One row per amend or cancel event, not per changed field. `changes` holds a
-- JSON object of only the fields that actually changed, shaped as
-- {"quantity": {"old": 5000, "new": 7500}} — so a no-op amend writes nothing.
-- Trade creation is deliberately not audited; the brief asks for a history of
-- amendments, and the trade row itself already records its own creation.

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('AMEND', 'CANCEL')),
  changes TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (trade_id) REFERENCES trades(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_trade_id ON audit_log (trade_id);

-- ---------------------------------------------------------------------------
-- 003_users.sql — login credentials (bonus: authentication)
-- ---------------------------------------------------------------------------
--
-- `password_hash` stores a salted scrypt digest as "<salt-hex>:<hash-hex>",
-- computed with node:crypto — never a plaintext password. Two demo users are
-- seeded on first startup when this table is empty (see
-- backend/src/db/seeds/users-seed.ts).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- ---------------------------------------------------------------------------
-- Not represented here
-- ---------------------------------------------------------------------------
--
-- Positions and P&L (bonus) have no tables — they're a pure read model derived
-- from `trades` on each request (FIFO lot-matching over the active trades for
-- a symbol), so there's no stored state to keep consistent. See
-- backend/src/positions/.
--
-- `schema_migrations` (name, applied_at) is created and maintained by the
-- migration runner itself (backend/src/db/migrate.ts) to track which files
-- have been applied; it isn't part of the domain model.
