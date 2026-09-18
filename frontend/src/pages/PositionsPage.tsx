import { usePositions } from "../features/positions/use-positions";
import { PositionsTable } from "../features/positions/PositionsTable";

export function PositionsPage() {
  const { positions, loading, error, lastUpdatedAt, refresh } = usePositions();

  return (
    <main className="positions-page">
      <header>
        <div className="header-meta">
          <h1>Positions</h1>
          <span className="trade-count">{positions.length.toLocaleString()} symbols</span>
          {lastUpdatedAt && (
            <span className="trade-count">as of {lastUpdatedAt.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && <p className="field-error">{error}</p>}
      {loading && positions.length === 0 && <p className="empty-state">Loading positions…</p>}

      {(!loading || positions.length > 0) && <PositionsTable positions={positions} />}
    </main>
  );
}
