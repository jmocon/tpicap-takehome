import type { RankedItem } from "./trade-analytics";
import { formatCompact } from "./trade-analytics";

interface RankedBarChartProps {
  title: string;
  items: RankedItem[];
  colorFor: (item: RankedItem, index: number) => string;
}

export function RankedBarChart({ title, items, colorFor }: RankedBarChartProps) {
  const max = Math.max(0, ...items.map((item) => item.value));

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {max === 0 ? (
        <p className="chart-empty">No data yet.</p>
      ) : (
        <div className="ranked-bars">
          {items.map((item, index) => (
            <div
              className="ranked-bar-row"
              key={item.label}
              title={`${item.label}: ${formatCompact(item.value)}`}
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
          ))}
        </div>
      )}
    </div>
  );
}
