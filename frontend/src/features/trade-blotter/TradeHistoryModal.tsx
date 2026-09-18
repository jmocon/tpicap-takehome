import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { tradesApi } from "../../api/trades-api";
import type { AuditLogEntry } from "../../types/trade";

interface TradeHistoryModalProps {
  tradeId: string;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function TradeHistoryModal({ tradeId, onClose }: TradeHistoryModalProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>();
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setEntries(undefined);
    setError(undefined);
    try {
      setEntries(await tradesApi.getAudit(tradeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trade history");
    }
  }, [tradeId]);

  useEffect(() => {
    // Fetching on mount/tradeId-change synchronizes with the backend (an
    // external system) — the documented legitimate case for setState-in-effect.
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, [load]);

  return (
    <Modal label={`Trade history for ${tradeId}`} onClose={onClose}>
      <h2>Trade History — {tradeId}</h2>

      {error && <p className="field-error">{error}</p>}
      {!error && !entries && <p className="empty-state">Loading…</p>}
      {entries && entries.length === 0 && (
        <p className="empty-state">No amendments or cancellations recorded for this trade.</p>
      )}
      {entries && entries.length > 0 && (
        <ul className="audit-log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="audit-log-entry">
              <div className="audit-log-entry-header">
                <span className={`audit-action audit-action-${entry.action.toLowerCase()}`}>{entry.action}</span>
                <span className="audit-log-timestamp">{new Date(entry.changedAt).toLocaleString()}</span>
              </div>
              <ul className="audit-log-changes">
                {Object.entries(entry.changes).map(([field, change]) => (
                  <li key={field}>
                    <strong>{field}</strong>: {formatValue(change.old)} → {formatValue(change.new)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="form-actions">
        {/* `load` is already stable (useCallback on tradeId), so a failed
            fetch is recoverable in place rather than close-and-reopen. */}
        {error && (
          <button type="button" className="btn-secondary" onClick={load}>
            Retry
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
