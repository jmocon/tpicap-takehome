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

CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
CREATE INDEX IF NOT EXISTS idx_trades_trader ON trades (trader);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);
