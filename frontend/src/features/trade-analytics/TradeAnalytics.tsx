import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Trade } from "../../types/trade";
import { aggregateActivity, aggregateBySide, aggregateBySymbol } from "./trade-analytics";
import { RankedBarChart } from "./RankedBarChart";
import { ActivityLineChart } from "./ActivityLineChart";

const ACTIVITY_TITLE: Record<"hour" | "day" | "week", string> = {
  hour: "Trade Activity (by hour)",
  day: "Trade Activity (by day)",
  week: "Trade Activity (by week)",
};

interface TradeAnalyticsProps {
  trades: Trade[];
}

export function TradeAnalytics({ trades }: TradeAnalyticsProps) {
  const navigate = useNavigate();
  const bySide = useMemo(() => aggregateBySide(trades), [trades]);
  const bySymbol = useMemo(() => aggregateBySymbol(trades), [trades]);
  const activity = useMemo(() => aggregateActivity(trades), [trades]);

  return (
    <section className="analytics-grid" aria-label="Trade analytics">
      <RankedBarChart
        title="Buy vs Sell Volume"
        items={bySide}
        colorFor={(item) => (item.label === "BUY" ? "var(--buy)" : "var(--sell)")}
      />
      <RankedBarChart
        title="Volume by Symbol"
        items={bySymbol}
        colorFor={(item) => (item.label === "Other" ? "var(--text-muted)" : "var(--chart-series-blue)")}
        onSelect={(item) => navigate(`/symbols/${encodeURIComponent(item.label)}`)}
      />
      <ActivityLineChart title={ACTIVITY_TITLE[activity.granularity]} points={activity.points} />
    </section>
  );
}
