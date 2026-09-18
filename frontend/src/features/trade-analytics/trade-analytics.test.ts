import { describe, expect, it } from "vitest";
import { makeTrade } from "../trade-blotter/trade-fixtures";
import {
  aggregateActivity,
  aggregateBySide,
  aggregateBySymbol,
  aggregateOHLC,
  aggregatePriceTrend,
} from "./trade-analytics";

describe("aggregateBySide", () => {
  it("sums active trade quantity per side and excludes cancelled trades", () => {
    const trades = [
      makeTrade({ side: "BUY", quantity: 100 }),
      makeTrade({ side: "BUY", quantity: 50 }),
      makeTrade({ side: "SELL", quantity: 30 }),
      makeTrade({ side: "SELL", quantity: 999, status: "CANCELLED" }),
    ];

    expect(aggregateBySide(trades)).toEqual([
      { label: "BUY", value: 150 },
      { label: "SELL", value: 30 },
    ]);
  });
});

describe("aggregateBySymbol", () => {
  it("ranks symbols by total active quantity, descending", () => {
    const trades = [
      makeTrade({ symbol: "AAPL", quantity: 10 }),
      makeTrade({ symbol: "MSFT", quantity: 50 }),
      makeTrade({ symbol: "AAPL", quantity: 20 }),
    ];

    expect(aggregateBySymbol(trades)).toEqual([
      { label: "MSFT", value: 50 },
      { label: "AAPL", value: 30 },
    ]);
  });

  it("folds symbols beyond topN into an Other bucket", () => {
    const trades = ["A", "B", "C", "D"].map((symbol) => makeTrade({ symbol, quantity: 10 }));

    const result = aggregateBySymbol(trades, 2);

    expect(result).toEqual([
      { label: "A", value: 10 },
      { label: "B", value: 10 },
      { label: "Other", value: 20 },
    ]);
  });
});

describe("aggregateActivity", () => {
  it("returns an empty day series for no trades", () => {
    expect(aggregateActivity([])).toEqual({ granularity: "day", points: [] });
  });

  it("buckets by hour when trades span less than two days", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-01T09:00:00.000Z" }),
      makeTrade({ tradeDate: "2026-01-01T09:30:00.000Z" }),
      makeTrade({ tradeDate: "2026-01-01T11:00:00.000Z" }),
    ];

    const series = aggregateActivity(trades);

    expect(series.granularity).toBe("hour");
    expect(series.points.reduce((sum, p) => sum + p.value, 0)).toBe(3);
  });

  it("buckets by day when trades span more than two days", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-01T00:00:00.000Z" }),
      makeTrade({ tradeDate: "2026-01-05T00:00:00.000Z" }),
    ];

    const series = aggregateActivity(trades);

    expect(series.granularity).toBe("day");
    expect(series.points.reduce((sum, p) => sum + p.value, 0)).toBe(2);
  });
});

describe("aggregatePriceTrend", () => {
  it("sorts trades chronologically and maps each to its price", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-03T00:00:00.000Z", price: 30 }),
      makeTrade({ tradeDate: "2026-01-01T00:00:00.000Z", price: 10 }),
      makeTrade({ tradeDate: "2026-01-02T00:00:00.000Z", price: 20 }),
    ];

    const points = aggregatePriceTrend(trades);

    expect(points.map((p) => p.value)).toEqual([10, 20, 30]);
  });

  it("returns one point for a single trade", () => {
    const points = aggregatePriceTrend([makeTrade({ price: 42 })]);

    expect(points).toHaveLength(1);
    expect(points[0]!.value).toBe(42);
  });

  it("returns an empty series for no trades", () => {
    expect(aggregatePriceTrend([])).toEqual([]);
  });
});

describe("aggregateOHLC", () => {
  it("returns an empty day series for no trades", () => {
    expect(aggregateOHLC([])).toEqual({ granularity: "day", bars: [] });
  });

  it("computes open/high/low/close from a multi-trade bucket", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-01T09:00:00.000Z", price: 100 }),
      makeTrade({ tradeDate: "2026-01-01T09:15:00.000Z", price: 120 }),
      makeTrade({ tradeDate: "2026-01-01T09:30:00.000Z", price: 90 }),
      makeTrade({ tradeDate: "2026-01-01T09:45:00.000Z", price: 110 }),
    ];

    const series = aggregateOHLC(trades);

    expect(series.granularity).toBe("hour");
    expect(series.bars).toHaveLength(1);
    expect(series.bars[0]).toMatchObject({ open: 100, high: 120, low: 90, close: 110 });
  });

  it("sets open=high=low=close for a single-trade bucket", () => {
    const series = aggregateOHLC([makeTrade({ tradeDate: "2026-01-01T09:00:00.000Z", price: 55 })]);

    expect(series.bars).toEqual([expect.objectContaining({ open: 55, high: 55, low: 55, close: 55 })]);
  });

  it("produces no bar for a bucket nothing traded in", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-01T00:00:00.000Z", price: 10 }),
      makeTrade({ tradeDate: "2026-01-05T00:00:00.000Z", price: 20 }),
    ];

    const series = aggregateOHLC(trades);

    expect(series.granularity).toBe("day");
    // Spans Jan 1 - Jan 5 (5 daily buckets) but only 2 actually traded.
    expect(series.bars).toHaveLength(2);
  });

  it("excludes cancelled trades from open/high/low/close, same as aggregateBySide/aggregateBySymbol", () => {
    const trades = [
      makeTrade({ tradeDate: "2026-01-01T09:00:00.000Z", price: 100 }),
      // A cancelled trade at an erroneous price — shouldn't be able to set
      // the bucket's high or move its close.
      makeTrade({ tradeDate: "2026-01-01T09:15:00.000Z", price: 9999, status: "CANCELLED" }),
      makeTrade({ tradeDate: "2026-01-01T09:30:00.000Z", price: 110 }),
    ];

    const series = aggregateOHLC(trades);

    expect(series.bars).toHaveLength(1);
    expect(series.bars[0]).toMatchObject({ open: 100, high: 110, low: 100, close: 110 });
  });

  it("returns an empty series when every trade in range is cancelled", () => {
    const series = aggregateOHLC([
      makeTrade({ tradeDate: "2026-01-01T09:00:00.000Z", price: 100, status: "CANCELLED" }),
    ]);

    expect(series).toEqual({ granularity: "day", bars: [] });
  });
});
