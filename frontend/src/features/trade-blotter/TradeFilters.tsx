import { useMemo } from "react";
import type { TradeQuery } from "../../api/trades-api";
import type { Trade } from "../../types/trade";
import { FilterSuggestInput } from "./FilterSuggestInput";
import { SelectField } from "../../components/SelectField";
import { RefreshIcon, SearchIcon } from "../../components/icons";

interface TradeFiltersProps {
  filters: TradeQuery;
  // The currently-loaded trades — used only to derive the Symbol/Trader
  // suggestion dropdowns client-side, no extra API call.
  trades: Trade[];
  onChange: (filters: TradeQuery) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function TradeFilters({ filters, trades, onChange, onRefresh, refreshing }: TradeFiltersProps) {
  const symbols = useMemo(() => trades.map((t) => t.symbol), [trades]);
  const traders = useMemo(() => trades.map((t) => t.trader), [trades]);

  function updateFilter<K extends keyof TradeQuery>(key: K, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="trade-filters">
      <FilterSuggestInput
        className="filter-symbol"
        icon={<SearchIcon />}
        placeholder="Symbol"
        ariaLabel="Symbol"
        value={filters.symbol ?? ""}
        candidates={symbols}
        onCommit={(value) => updateFilter("symbol", value)}
      />
      <FilterSuggestInput
        className="filter-trader"
        icon={<SearchIcon />}
        placeholder="Trader"
        ariaLabel="Trader"
        value={filters.trader ?? ""}
        candidates={traders}
        onCommit={(value) => updateFilter("trader", value)}
      />
      <SelectField
        aria-label="Side"
        value={filters.side ?? ""}
        onChange={(e) => updateFilter("side", e.target.value)}
      >
        <option value="">All sides</option>
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
      </SelectField>
      <SelectField
        aria-label="Status"
        value={filters.status ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="CANCELLED">CANCELLED</option>
      </SelectField>
      <button type="button" className="btn-secondary btn-icon" onClick={onRefresh} disabled={refreshing}>
        <RefreshIcon />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
