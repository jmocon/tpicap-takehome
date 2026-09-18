import type { AuditAction, ChangeSet } from "./audit.types.js";

export interface AuditLogEntryInput {
  tradeId: string;
  action: AuditAction;
  changes: ChangeSet;
}

export interface AuditLogger {
  record(entry: AuditLogEntryInput): void;
}

export const noopAuditLogger: AuditLogger = {
  record() {
    // intentionally does nothing — used where no audit trail is needed (e.g. tests)
  },
};
