import type { RankedItem } from "./trade-analytics";
import { formatCompact } from "./trade-analytics";

interface RankedBarChartProps {
  title: string;
  items: RankedItem[];
  colorFor: (item: RankedItem, index: number) => string;
  // Optional click handler per row — backward-compatible, the two existing
  // call sites (Buy vs Sell, and callers that don't need navigation) simply
  // omit it and rows render as plain (non-interactive) bars. The "Other"
  // overflow bucket (see aggregateBySymbol) is never selectable — it isn't a
  // real symbol/entity to navigate to.
  onSelect?: (item: RankedItem) => void;
}

export function RankedBarChart({ title, items, colorFor, onSelect }: RankedBarChartProps) {
  const max = Math.max(0, ...items.map((item) => item.value));

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {max === 0 ? (
        <p className="chart-empty">No data yet.</p>
      ) : (
        <div className="ranked-bars">
          {items.map((item, index) => {
            const selectable = Boolean(onSelect) && item.label !== "Other";
            return (
              <div
                className={selectable ? "ranked-bar-row ranked-bar-row-selectable" : "ranked-bar-row"}
                key={item.label}
                title={`${item.label}: ${formatCompact(item.value)}`}
                role={selectable ? "button" : undefined}
                tabIndex={selectable ? 0 : undefined}
                onClick={selectable ? () => onSelect!(item) : undefined}
                onKeyDown={
                  selectable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect!(item);
                        }
                      }
                    : undefined
                }
              >
                <span className="ranked-bar-label">{item.label}</span>
                <div className="ranked-bar-track">
                  <div
                    className="ranked-bar-fill"
                    style={{ width: `${(item.value / max) * 100}%`, background: colorFor(item, index) }}
                  />
                </div>
                <span className="ranked-bar-value">{formatCompact(item.value)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
