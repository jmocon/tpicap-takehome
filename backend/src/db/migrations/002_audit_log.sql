CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('AMEND', 'CANCEL')),
  changes TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (trade_id) REFERENCES trades(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_log_trade_id ON audit_log (trade_id);
