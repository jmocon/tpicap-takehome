import type { Trade } from "../../types/trade";
import type { TradeQuery } from "../../api/trades-api";

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
}

export function TradeTable({ trades, sortBy, sortDir, onSortChange, onAmend, onCancel }: TradeTableProps) {
  if (trades.length === 0) {
    return <p className="empty-state">No trades match the current filters.</p>;
  }

  return (
    <table className="trade-table">
      <thead>
        <tr>
          {COLUMNS.map((column) => (
            <th key={column.field}>
              <button type="button" className="sort-button" onClick={() => onSortChange(column.field)}>
                {column.label}
                {sortBy === column.field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
              </button>
            </th>
          ))}
          <th>Side</th>
          <th aria-label="actions" />
        </tr>
      </thead>
      <tbody>
        {trades.map((trade) => {
          const isCancelled = trade.status === "CANCELLED";
          return (
            <tr key={trade.id} className={isCancelled ? "row-cancelled" : ""}>
              <td>{trade.symbol}</td>
              <td>{trade.trader}</td>
              <td className="cell-quantity">{trade.quantity.toLocaleString()}</td>
              <td className="cell-price">{trade.price.toFixed(2)}</td>
              <td>{new Date(trade.tradeDate).toLocaleString()}</td>
              <td>{trade.status}</td>
              <td>
                <span className={`side-badge side-${trade.side.toLowerCase()}`}>{trade.side}</span>
              </td>
              <td className="row-actions">
                <button type="button" className="btn-secondary" onClick={() => onAmend(trade)} disabled={isCancelled}>
                  Amend
                </button>
                <button
                  type="button"
                  className="btn-ghost-danger"
                  onClick={() => onCancel(trade)}
                  disabled={isCancelled}
                >
                  Cancel
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
