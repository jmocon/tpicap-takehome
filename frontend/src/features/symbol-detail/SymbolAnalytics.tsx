import { useMemo } from "react";
import type { Trade } from "../../types/trade";
import { aggregateActivity, aggregateBySide, aggregateOHLC } from "../trade-analytics/trade-analytics";
import { RankedBarChart } from "../trade-analytics/RankedBarChart";
import { ActivityLineChart } from "../trade-analytics/ActivityLineChart";
import { OHLCChart } from "../trade-analytics/OHLCChart";
import { BarChartIcon, TrendingUpIcon } from "../../components/icons";

const ACTIVITY_TITLE: Record<"hour" | "day" | "week", string> = {
  hour: "Trade Activity (by hour)",
  day: "Trade Activity (by day)",
  week: "Trade Activity (by week)",
};

interface SymbolAnalyticsProps {
  symbol: string;
  // Already filtered down to this symbol's trades by the caller (SymbolPage).
  trades: Trade[];
}

export function SymbolAnalytics({ symbol, trades }: SymbolAnalyticsProps) {
  // OHLC subsumes the plain price-trend line (it's the same underlying price
  // series, just with per-bucket high/low/open/close instead of one point) —
  // showing both here would be redundant, so this page gets the richer
  // candlestick chart. The plain line (aggregatePriceTrend) stays in use for
  // TradeTable's per-row sparkline, where a candlestick chart would be
  // unreadable at ~60x24px.
  const ohlc = useMemo(() => aggregateOHLC(trades), [trades]);
  const bySide = useMemo(() => aggregateBySide(trades), [trades]);
  const activity = useMemo(() => aggregateActivity(trades), [trades]);

  return (
    // One chart per row, so both SVG charts use the wide viewBox — see
    // ChartVariant for why the box widens instead of the height being capped.
    <section className="analytics-grid-stacked" aria-label={`${symbol} analytics`}>
      <OHLCChart
        title={`${symbol} Price (OHLC)`}
        icon={<TrendingUpIcon size={18} />}
        bars={ohlc.bars}
        variant="wide"
      />
      <RankedBarChart
        title={`${symbol} Buy vs Sell Volume`}
        icon={<BarChartIcon size={18} />}
        items={bySide}
        colorFor={(item) => (item.label === "BUY" ? "var(--buy)" : "var(--sell)")}
      />
      <ActivityLineChart
        title={`${symbol} ${ACTIVITY_TITLE[activity.granularity]}`}
        icon={<TrendingUpIcon size={18} />}
        points={activity.points}
        variant="wide"
      />
    </section>
  );
}
