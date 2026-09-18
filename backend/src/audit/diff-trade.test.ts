import { describe, expect, it } from "vitest";
import { diffTrade } from "./diff-trade.js";
import type { Trade } from "../trades/trades.types.js";

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: "TRD-1",
    symbol: "AAPL",
    side: "BUY",
    quantity: 100,
    price: 150,
    trader: "JSMITH",
    tradeDate: "2026-01-01T00:00:00.000Z",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("diffTrade", () => {
  it("returns an empty ChangeSet when nothing changed", () => {
    const trade = makeTrade();
    expect(diffTrade(trade, makeTrade())).toEqual({});
  });

  it("diffs a single changed field", () => {
    const before = makeTrade({ quantity: 100 });
    const after = makeTrade({ quantity: 250 });

    expect(diffTrade(before, after)).toEqual({
      quantity: { old: 100, new: 250 },
    });
  });

  it("diffs multiple changed fields, leaving unchanged fields out", () => {
    const before = makeTrade({ price: 150, trader: "JSMITH", symbol: "AAPL" });
    const after = makeTrade({ price: 175.5, trader: "BJONES", symbol: "AAPL" });

    expect(diffTrade(before, after)).toEqual({
      price: { old: 150, new: 175.5 },
      trader: { old: "JSMITH", new: "BJONES" },
    });
  });

  it("treats an optional field going from set to undefined as a change", () => {
    const before = makeTrade({ book: "EQ-1" });
    const after = makeTrade({ book: undefined });

    expect(diffTrade(before, after)).toEqual({
      book: { old: "EQ-1", new: null },
    });
  });

  it("ignores fields outside the fixed diff list (e.g. status, id)", () => {
    const before = makeTrade({ status: "ACTIVE" });
    const after = makeTrade({ status: "CANCELLED" });

    expect(diffTrade(before, after)).toEqual({});
  });
});
