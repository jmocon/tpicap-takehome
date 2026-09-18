import type { Position } from "../../types/position";

interface PositionsTableProps {
  positions: Position[];
}

/** "+"-prefixed for positive/zero, "-" falls out of the number itself for negative. */
function formatPnl(value: number): string {
  const formatted = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `-${formatted}` : `+${formatted}`;
}

function pnlClassName(value: number): string {
  if (value > 0) return "pnl-positive";
  if (value < 0) return "pnl-negative";
  return "";
}

export function PositionsTable({ positions }: PositionsTableProps) {
  if (positions.length === 0) {
    return <p className="empty-state">No open positions.</p>;
  }

  return (
    // Same treatment as the blotter: 7 numeric columns overflow narrow
    // viewports, and only the table should scroll for it.
    <div className="table-scroll">
      <table className="trade-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Net Qty</th>
            <th>Avg Open Price</th>
            <th>Last Price</th>
            <th>Realized P&amp;L</th>
            <th>Unrealized P&amp;L</th>
            <th>Total P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.symbol}>
              <td>{position.symbol}</td>
              <td className="cell-quantity">{position.netQuantity.toLocaleString()}</td>
              <td className="cell-price">{position.avgOpenPrice.toFixed(2)}</td>
              <td className="cell-price">{position.lastPrice.toFixed(2)}</td>
              <td className={pnlClassName(position.realizedPnl)}>{formatPnl(position.realizedPnl)}</td>
              <td className={pnlClassName(position.unrealizedPnl)}>{formatPnl(position.unrealizedPnl)}</td>
              <td className={pnlClassName(position.totalPnl)}>{formatPnl(position.totalPnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
