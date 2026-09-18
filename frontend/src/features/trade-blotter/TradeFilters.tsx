import type { TradeQuery } from "../../api/trades-api";

interface TradeFiltersProps {
  filters: TradeQuery;
  onChange: (filters: TradeQuery) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function TradeFilters({ filters, onChange, onRefresh, refreshing }: TradeFiltersProps) {
  function updateFilter<K extends keyof TradeQuery>(key: K, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="trade-filters">
      <input
        type="text"
        className="filter-symbol"
        placeholder="Symbol"
        value={filters.symbol ?? ""}
        onChange={(e) => updateFilter("symbol", e.target.value)}
      />
      <input
        type="text"
        className="filter-trader"
        placeholder="Trader"
        value={filters.trader ?? ""}
        onChange={(e) => updateFilter("trader", e.target.value)}
      />
      <select value={filters.side ?? ""} onChange={(e) => updateFilter("side", e.target.value)}>
        <option value="">All sides</option>
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
      </select>
      <select value={filters.status ?? ""} onChange={(e) => updateFilter("status", e.target.value)}>
        <option value="">All statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      <button type="button" className="btn-secondary" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
