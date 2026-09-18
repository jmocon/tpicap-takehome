import type { DatabaseSync } from "node:sqlite";
import type { AuditLogEntryInput, AuditLogger } from "./audit-logger.js";
import { rowToAuditLogEntry, type AuditLogEntry, type AuditLogRow } from "./audit.types.js";

export class AuditRepository implements AuditLogger {
  constructor(private readonly db: DatabaseSync) {}

  record(entry: AuditLogEntryInput): void {
    this.db
      .prepare(`INSERT INTO audit_log (trade_id, action, changes) VALUES (@tradeId, @action, @changes)`)
      .run({
        tradeId: entry.tradeId,
        action: entry.action,
        changes: JSON.stringify(entry.changes),
      });
  }

  listByTradeId(tradeId: string): AuditLogEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM audit_log WHERE trade_id = ? ORDER BY changed_at DESC, id DESC")
      .all(tradeId);
    return (rows as unknown as AuditLogRow[]).map(rowToAuditLogEntry);
  }
}
