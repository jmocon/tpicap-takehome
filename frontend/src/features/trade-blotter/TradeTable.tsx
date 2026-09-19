import { Fragment, useMemo, useState } from "react";
import type { Trade } from "../../types/trade";
import type { TradeQuery } from "../../api/trades-api";
import { aggregatePriceTrend, type ActivityPoint } from "../trade-analytics/trade-analytics";
import { Sparkline } from "../trade-analytics/Sparkline";
import { TradeHistoryModal } from "./TradeHistoryModal";
import { SymbolBadge } from "../../components/SymbolBadge";
import { CancelIcon, HistoryIcon, PencilIcon } from "../../components/icons";

interface Column {
  label: string;
  field: NonNullable<TradeQuery["sortBy"]>;
}

const COLUMNS: Column[] = [
  { label: "Symbol", field: "symbol" },
  { label: "Trader", field: "trader" },
  { label: "Quantity", field: "quantity" },
  { label: "Price", field: "price" },
  { label: "Trade Date", field: "tradeDate" },
  { label: "Status", field: "status" },
];

interface TradeTableProps {
  trades: Trade[];
  sortBy?: TradeQuery["sortBy"];
  sortDir?: TradeQuery["sortDir"];
  onSortChange: (field: NonNullable<TradeQuery["sortBy"]>) => void;
  onAmend: (trade: Trade) => void;
  onCancel: (trade: Trade) => void;
  /** Id of the trade whose cancel request is currently in flight, if any. */
  cancellingId?: string;
}

export function TradeTable({ trades, sortBy, sortDir, onSortChange, onAmend, onCancel, cancellingId }: TradeTableProps) {
  const [historyTradeId, setHistoryTradeId] = useState<string>();

  // One price series per distinct symbol, computed once regardless of how
  // many rows share that symbol — each row then does an O(1) lookup instead
  // of re-sorting/re-mapping its symbol's trades on every render.
  const priceSeriesBySymbol = useMemo(() => {
    const bySymbol = new Map<string, Trade[]>();
    for (const trade of trades) {
      const existing = bySymbol.get(trade.symbol);
      if (existing) existing.push(trade);
      else bySymbol.set(trade.symbol, [trade]);
    }
    const series = new Map<string, ActivityPoint[]>();
    for (const [symbol, symbolTrades] of bySymbol) {
      series.set(symbol, aggregatePriceTrend(symbolTrades));
    }
    return series;
  }, [trades]);

  if (trades.length === 0) {
    return <p className="empty-state">No trades match the current filters.</p>;
  }

  return (
    <>
      {/* Only the table scrolls sideways when the 9 columns outgrow the
          viewport — the page header and nav stay put. */}
      <div className="table-scroll">
        <table className="trade-table trade-table-blotter">
          <thead>
            <tr>
              {COLUMNS.map((column, index) => (
                <Fragment key={column.field}>
                  <th>
                    <button type="button" className="sort-button" onClick={() => onSortChange(column.field)}>
                      {column.label}
                      {sortBy === column.field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                  {index === 0 && <th>Trend</th>}
                </Fragment>
              ))}
              <th>Side</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isCancelled = trade.status === "CANCELLED";
              const isCancelling = cancellingId === trade.id;
              return (
                <tr key={trade.id} className={isCancelled ? "row-cancelled" : ""}>
                  <td className="cell-symbol">
                    <SymbolBadge symbol={trade.symbol} />
                  </td>
                  <td className="cell-trend">
                    <Sparkline points={priceSeriesBySymbol.get(trade.symbol) ?? []} />
                  </td>
                  <td>{trade.trader}</td>
                  <td className="cell-quantity">{trade.quantity.toLocaleString()}</td>
                  <td className="cell-price">{trade.price.toFixed(2)}</td>
                  <td className="cell-date">{new Date(trade.tradeDate).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill status-${trade.status.toLowerCase()}`}>{trade.status}</span>
                  </td>
                  <td>
                    <span className={`side-badge side-${trade.side.toLowerCase()}`}>{trade.side}</span>
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn-ghost btn-icon"
                      onClick={() => onAmend(trade)}
                      disabled={isCancelled || isCancelling}
                    >
                      <PencilIcon />
                      Amend
                    </button>
                    {/* Cancel is destructive and irreversible, so the button
                        latches while its request is in flight — a second click
                        on a slow connection would otherwise fire a second
                        cancel before the first response lands. */}
                    <button
                      type="button"
                      className="btn-ghost-danger btn-icon"
                      onClick={() => onCancel(trade)}
                      disabled={isCancelled || isCancelling}
                    >
                      <CancelIcon />
                      {isCancelling ? "Cancelling…" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-icon"
                      onClick={() => setHistoryTradeId(trade.id)}
                    >
                      <HistoryIcon />
                      History
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {historyTradeId && <TradeHistoryModal tradeId={historyTradeId} onClose={() => setHistoryTradeId(undefined)} />}
    </>
  );
}
