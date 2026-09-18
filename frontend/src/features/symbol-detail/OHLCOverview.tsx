import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Trade } from "../../types/trade";
import { aggregateBySymbol, aggregateOHLC } from "../trade-analytics/trade-analytics";
import { OHLCChart } from "../trade-analytics/OHLCChart";

const OVERVIEW_SYMBOL_COUNT = 5;

interface OHLCOverviewProps {
  trades: Trade[];
}

// Shown on /symbols with no symbol selected yet — an OHLC chart per top
// symbol (by traded volume) rather than an empty page, since picking one
// symbol arbitrarily (e.g. "first alphabetically") wouldn't be a more
// useful default than just showing what's actually active.
export function OHLCOverview({ trades }: OHLCOverviewProps) {
  const navigate = useNavigate();

  const topSymbols = useMemo(
    () =>
      aggregateBySymbol(trades, OVERVIEW_SYMBOL_COUNT)
        .filter((item) => item.label !== "Other")
        .slice(0, OVERVIEW_SYMBOL_COUNT)
        .map((item) => item.label),
    [trades],
  );

  if (topSymbols.length === 0) {
    return <p className="empty-state">No trades yet.</p>;
  }

  return (
    <>
      <p className="symbol-overview-hint">Top {topSymbols.length} symbols by volume — pick one above for the full view.</p>
      <div className="analytics-grid-stacked">
        {topSymbols.map((symbol) => {
          const series = aggregateOHLC(trades.filter((t) => t.symbol === symbol));
          return (
            <div
              key={symbol}
              className="chart-card-link"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/symbols/${encodeURIComponent(symbol)}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/symbols/${encodeURIComponent(symbol)}`);
                }
              }}
            >
              <OHLCChart title={symbol} bars={series.bars} variant="wide" />
            </div>
          );
        })}
      </div>
    </>
  );
}
