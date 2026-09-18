import { describe, expect, it } from "vitest";
import { computeFifoPnl, type FifoTradeInput } from "./fifo-pnl.js";

function trade(side: FifoTradeInput["side"], quantity: number, price: number): FifoTradeInput {
  return { side, quantity, price };
}

describe("computeFifoPnl", () => {
  it("returns zero realized P&L and no open lots for empty input", () => {
    const result = computeFifoPnl([]);
    expect(result).toEqual({ realizedPnl: 0, openLots: [] });
  });

  it("opens a single lot for a single BUY with no realized P&L", () => {
    const result = computeFifoPnl([trade("BUY", 10, 100)]);

    expect(result.realizedPnl).toBe(0);
    expect(result.openLots).toEqual([{ side: "BUY", quantity: 10, price: 100 }]);
  });

  it("opens a single lot for a single SELL (short) with no realized P&L", () => {
    const result = computeFifoPnl([trade("SELL", 10, 100)]);

    expect(result.realizedPnl).toBe(0);
    expect(result.openLots).toEqual([{ side: "SELL", quantity: 10, price: 100 }]);
  });

  it("partially closes a long: realizes P&L on the matched portion, leaves a smaller open lot", () => {
    // BUY 10 @ 100, then SELL 4 @ 120 closes 4 of the 10 at a 20/unit profit.
    const result = computeFifoPnl([trade("BUY", 10, 100), trade("SELL", 4, 120)]);

    expect(result.realizedPnl).toBe(4 * (120 - 100));
    expect(result.openLots).toEqual([{ side: "BUY", quantity: 6, price: 100 }]);
  });

  it("exactly closes a long: fully realizes P&L, leaves no open lots", () => {
    const result = computeFifoPnl([trade("BUY", 10, 100), trade("SELL", 10, 130)]);

    expect(result.realizedPnl).toBe(10 * (130 - 100));
    expect(result.openLots).toEqual([]);
  });

  it("exactly closes a short: fully realizes P&L, leaves no open lots", () => {
    // SELL 10 @ 100 (short), then BUY 10 @ 80 closes it at a 20/unit profit (price fell).
    const result = computeFifoPnl([trade("SELL", 10, 100), trade("BUY", 10, 80)]);

    expect(result.realizedPnl).toBe(10 * (100 - 80));
    expect(result.openLots).toEqual([]);
  });

  it("flips long to short when a SELL exceeds the open BUY quantity", () => {
    // BUY 10 @ 100, then SELL 15 @ 120: closes the 10 (realized on 10), then
    // the remaining 5 opens a new SELL lot — no special-case flip branch.
    const result = computeFifoPnl([trade("BUY", 10, 100), trade("SELL", 15, 120)]);

    expect(result.realizedPnl).toBe(10 * (120 - 100));
    expect(result.openLots).toEqual([{ side: "SELL", quantity: 5, price: 120 }]);
  });

  it("flips short to long when a BUY exceeds the open SELL quantity", () => {
    // SELL 10 @ 100 (short), then BUY 15 @ 90: closes the 10 short (realized on 10), then
    // the remaining 5 opens a new BUY lot.
    const result = computeFifoPnl([trade("SELL", 10, 100), trade("BUY", 15, 90)]);

    expect(result.realizedPnl).toBe(10 * (100 - 90));
    expect(result.openLots).toEqual([{ side: "BUY", quantity: 5, price: 90 }]);
  });

  it("matches the oldest lot first (FIFO), not an average-cost blend", () => {
    // Two open BUY lots at different prices: 10 @ 100 (oldest), 10 @ 120 (newer).
    // SELL 15 @ 150 should consume the oldest lot fully (10 @ 100) before
    // touching the newer one (5 @ 120) — not blend into an average cost of 110.
    const result = computeFifoPnl([trade("BUY", 10, 100), trade("BUY", 10, 120), trade("SELL", 15, 150)]);

    // FIFO: 10 * (150 - 100) + 5 * (150 - 120) = 500 + 150 = 650.
    // An average-cost approach would instead give 15 * (150 - 110) = 600 —
    // a different number, proving this isn't what's being computed here.
    expect(result.realizedPnl).toBe(650);
    expect(result.openLots).toEqual([{ side: "BUY", quantity: 5, price: 120 }]);
  });

  it("accumulates realized P&L across multiple round trips on the same symbol", () => {
    const result = computeFifoPnl([
      trade("BUY", 10, 100), // open long 10 @ 100
      trade("SELL", 10, 110), // close it: +10 * 10 = 100
      trade("SELL", 5, 90), // open short 5 @ 90
      trade("BUY", 5, 80), // close it: +5 * 10 = 50
      trade("BUY", 8, 50), // open long 8 @ 50
      trade("SELL", 8, 55), // close it: +8 * 5 = 40
    ]);

    expect(result.realizedPnl).toBe(100 + 50 + 40);
    expect(result.openLots).toEqual([]);
  });

  it("keeps quantities and prices intact when closes and opens interleave across many lots", () => {
    const result = computeFifoPnl([
      trade("BUY", 5, 100),
      trade("BUY", 5, 110),
      trade("BUY", 5, 120),
      trade("SELL", 7, 130), // closes 5@100 + 2@110
    ]);

    // 5 * (130 - 100) + 2 * (130 - 110) = 150 + 40 = 190
    expect(result.realizedPnl).toBe(190);
    expect(result.openLots).toEqual([
      { side: "BUY", quantity: 3, price: 110 },
      { side: "BUY", quantity: 5, price: 120 },
    ]);
  });
});
