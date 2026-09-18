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

// Adaptive granularity shared by every bucketed (as opposed to per-trade)
// chart in this module — hourly for a ≤2-day span, daily for ≤90 days, else
// weekly. Kept as one function so aggregateActivity/aggregateOHLC can't drift.
function pickGranularity(spanMs: number): ActivityGranularity {
  return spanMs <= 2 * DAY_MS ? "hour" : spanMs <= 90 * DAY_MS ? "day" : "week";
}

interface Bucketing {
  stepMs: number;
  bucketStart: (ms: number) => number;
  formatLabel: (ms: number) => string;
}

function bucketingFor(granularity: ActivityGranularity): Bucketing {
  switch (granularity) {
    case "hour":
      return { stepMs: HOUR_MS, bucketStart: startOfHour, formatLabel: formatHour };
    case "day":
      return { stepMs: DAY_MS, bucketStart: startOfDay, formatLabel: formatDay };
    case "week":
      return { stepMs: WEEK_MS, bucketStart: startOfWeek, formatLabel: formatDay };
  }
}

export function aggregateActivity(trades: Trade[]): ActivitySeries {
  if (trades.length === 0) return { granularity: "day", points: [] };

  const timestamps = trades.map((t) => new Date(t.tradeDate).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const granularity = pickGranularity(max - min);
  const { stepMs, bucketStart, formatLabel } = bucketingFor(granularity);

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

export interface OHLCBar {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OHLCSeries {
  granularity: ActivityGranularity;
  bars: OHLCBar[];
}

// Same adaptive bucketing as aggregateActivity, but each bucket becomes one
// O/H/L/C bar instead of a trade count. Unlike aggregateActivity, an empty
// bucket produces no bar at all (there's no meaningful open/high/low/close
// for a period nothing traded in) rather than a zero-value point.
//
// Cancelled trades are excluded, same reasoning as aggregateBySide/
// aggregateBySymbol: a cancelled trade's price was never a real execution,
// so it shouldn't be able to set a bar's open/high/low/close either.
export function aggregateOHLC(allTrades: Trade[]): OHLCSeries {
  const trades = allTrades.filter(isActive);
  if (trades.length === 0) return { granularity: "day", bars: [] };

  const timestamps = trades.map((t) => new Date(t.tradeDate).getTime());
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  const granularity = pickGranularity(max - min);
  const { stepMs, bucketStart, formatLabel } = bucketingFor(granularity);

  const buckets = new Map<number, Trade[]>();
  for (const trade of trades) {
    const key = bucketStart(new Date(trade.tradeDate).getTime());
    const existing = buckets.get(key);
    if (existing) existing.push(trade);
    else buckets.set(key, [trade]);
  }

  const firstBucket = bucketStart(min);
  const lastBucket = bucketStart(max);
  const bars: OHLCBar[] = [];
  for (let t = firstBucket; t <= lastBucket; t += stepMs) {
    const bucketTrades = buckets.get(t);
    if (!bucketTrades) continue;

    const sorted = [...bucketTrades].sort(
      (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime(),
    );
    const prices = sorted.map((trade) => trade.price);
    bars.push({
      label: formatLabel(t),
      open: sorted[0]!.price,
      close: sorted[sorted.length - 1]!.price,
      high: Math.max(...prices),
      low: Math.min(...prices),
    });
  }

  return { granularity, bars };
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Per-trade price series for a single symbol, sorted chronologically — unlike
// aggregateActivity this doesn't bucket: each point is one trade's price.
// Shared by SymbolPage's price-trend chart and TradeTable's per-row sparkline
// so the two call sites can't drift.
export function aggregatePriceTrend(trades: Trade[]): ActivityPoint[] {
  return [...trades]
    .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime())
    .map((trade) => ({ label: formatDateTime(new Date(trade.tradeDate).getTime()), value: trade.price }));
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
