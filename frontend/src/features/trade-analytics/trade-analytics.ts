import type { Trade } from "../../types/trade";

export interface RankedItem {
  label: string;
  value: number;
}

function isActive(trade: Trade): boolean {
  return trade.status === "ACTIVE";
}

// Cancelled trades never represented real executed volume, so they're excluded
// from the volume-based charts (side split, symbol ranking) — but kept in the
// activity chart, which tracks trading *activity* over time, not live exposure.
export function aggregateBySide(trades: Trade[]): RankedItem[] {
  const active = trades.filter(isActive);
  const buyQty = active.filter((t) => t.side === "BUY").reduce((sum, t) => sum + t.quantity, 0);
  const sellQty = active.filter((t) => t.side === "SELL").reduce((sum, t) => sum + t.quantity, 0);
  return [
    { label: "BUY", value: buyQty },
    { label: "SELL", value: sellQty },
  ];
}

export function aggregateBySymbol(trades: Trade[], topN = 6): RankedItem[] {
  const totals = new Map<string, number>();
  for (const trade of trades) {
    if (!isActive(trade)) continue;
    totals.set(trade.symbol, (totals.get(trade.symbol) ?? 0) + trade.quantity);
  }

  const ranked = [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  if (ranked.length <= topN) return ranked;

  const head = ranked.slice(0, topN);
  const otherValue = ranked.slice(topN).reduce((sum, item) => sum + item.value, 0);
  return [...head, { label: "Other", value: otherValue }];
}

export interface ActivityPoint {
  label: string;
  value: number;
}

export type ActivityGranularity = "hour" | "day" | "week";

export interface ActivitySeries {
  granularity: ActivityGranularity;
  points: ActivityPoint[];
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function startOfHour(ms: number): number {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ms: number): number {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

function formatHour(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric" });
}

function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function aggregateActivity(trades: Trade[]): ActivitySeries {
  if (trades.length === 0) return { granularity: "day", points: [] };

  const timestamps = trades.map((t) => new Date(t.tradeDate).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const spanMs = max - min;

  const granularity: ActivityGranularity = spanMs <= 2 * DAY_MS ? "hour" : spanMs <= 90 * DAY_MS ? "day" : "week";
  const stepMs = granularity === "hour" ? HOUR_MS : granularity === "day" ? DAY_MS : WEEK_MS;
  const bucketStart = granularity === "hour" ? startOfHour : granularity === "day" ? startOfDay : startOfWeek;
  const formatLabel = granularity === "hour" ? formatHour : formatDay;

  const counts = new Map<number, number>();
  for (const trade of trades) {
    const key = bucketStart(new Date(trade.tradeDate).getTime());
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const firstBucket = bucketStart(min);
  const lastBucket = bucketStart(max);
  const points: ActivityPoint[] = [];
  for (let t = firstBucket; t <= lastBucket; t += stepMs) {
    points.push({ label: formatLabel(t), value: counts.get(t) ?? 0 });
  }

  return { granularity, points };
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
