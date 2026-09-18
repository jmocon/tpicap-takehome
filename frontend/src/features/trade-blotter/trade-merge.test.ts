import { describe, expect, it } from "vitest";
import { compareTrades, matchesQuery, mergeTradeEvent } from "./trade-merge";
import { makeTrade } from "./trade-fixtures";

describe("matchesQuery", () => {
  it("matches symbol and trader case-insensitively on a substring", () => {
    const trade = makeTrade({ symbol: "AAPL", trader: "JSMITH" });
    // Mirrors the backend's LIKE '%x%' — a partial, lowercase term must match.
    expect(matchesQuery(trade, { symbol: "ap" })).toBe(true);
    expect(matchesQuery(trade, { trader: "smith" })).toBe(true);
    expect(matchesQuery(trade, { symbol: "msft" })).toBe(false);
  });

  it("matches side and status exactly", () => {
    const trade = makeTrade({ side: "BUY", status: "ACTIVE" });
    expect(matchesQuery(trade, { side: "BUY" })).toBe(true);
    expect(matchesQuery(trade, { side: "SELL" })).toBe(false);
    expect(matchesQuery(trade, { status: "CANCELLED" })).toBe(false);
  });

  it("matches everything when no filters are set", () => {
    expect(matchesQuery(makeTrade(), {})).toBe(true);
  });
});

describe("compareTrades", () => {
  it("defaults to trade date descending, like the backend's ORDER BY", () => {
    const older = makeTrade({ id: "A", tradeDate: "2026-01-01T00:00:00.000Z" });
    const newer = makeTrade({ id: "B", tradeDate: "2026-02-01T00:00:00.000Z" });
    expect(compareTrades(newer, older, {})).toBeLessThan(0);
  });

  it("sorts numerically, not lexicographically, on numeric columns", () => {
    const small = makeTrade({ id: "A", price: 9 });
    const large = makeTrade({ id: "B", price: 100 });
    expect(compareTrades(small, large, { sortBy: "price", sortDir: "asc" })).toBeLessThan(0);
  });
});

describe("mergeTradeEvent", () => {
  const sortByPriceAsc = { sortBy: "price", sortDir: "asc" } as const;

  it("inserts a new trade at its sorted position, not at the top", () => {
    const current = [makeTrade({ id: "A", price: 10 }), makeTrade({ id: "C", price: 30 })];

    const merged = mergeTradeEvent(current, makeTrade({ id: "B", price: 20 }), sortByPriceAsc);

    expect(merged.map((t) => t.id)).toEqual(["A", "B", "C"]);
  });

  it("replaces an existing trade in place and re-sorts", () => {
    const current = [makeTrade({ id: "A", price: 10 }), makeTrade({ id: "B", price: 20 })];

    const merged = mergeTradeEvent(current, makeTrade({ id: "A", price: 99 }), sortByPriceAsc);

    expect(merged.map((t) => t.id)).toEqual(["B", "A"]);
    expect(merged).toHaveLength(2);
  });

  it("ignores a trade that does not match the active filter", () => {
    const current = [makeTrade({ id: "A", symbol: "AAPL" })];

    const merged = mergeTradeEvent(current, makeTrade({ id: "B", symbol: "MSFT" }), { symbol: "AAPL" });

    expect(merged).toBe(current);
  });

  it("drops a visible trade that stops matching the filter", () => {
    const current = [makeTrade({ id: "A", status: "ACTIVE" })];

    const merged = mergeTradeEvent(current, makeTrade({ id: "A", status: "CANCELLED" }), { status: "ACTIVE" });

    expect(merged).toEqual([]);
  });

  it("keeps rows the comparator ties stable in their existing order", () => {
    const current = [makeTrade({ id: "A", price: 10 }), makeTrade({ id: "B", price: 10 })];

    const merged = mergeTradeEvent(current, makeTrade({ id: "C", price: 10 }), sortByPriceAsc);

    expect(merged.map((t) => t.id)).toEqual(["A", "B", "C"]);
  });
});
