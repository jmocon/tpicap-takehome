export type AuditAction = "AMEND" | "CANCEL";

export interface FieldChange {
  old: unknown;
  new: unknown;
}

/** Keyed by field name (e.g. "quantity", "status") — one row per event, not per field. */
export type ChangeSet = Record<string, FieldChange>;

export interface AuditLogEntry {
  id: number;
  tradeId: string;
  action: AuditAction;
  changes: ChangeSet;
  changedAt: string;
}

export interface AuditLogRow {
  id: number;
  trade_id: string;
  action: AuditAction;
  changes: string;
  changed_at: string;
}

export function rowToAuditLogEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    tradeId: row.trade_id,
    action: row.action,
    changes: JSON.parse(row.changes) as ChangeSet,
    changedAt: row.changed_at,
  };
}
