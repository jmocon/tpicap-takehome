import { afterEach, describe, expect, it, vi } from "vitest";
import { generateRandomTrade } from "./random-trade";

const SYMBOLS = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN", "NFLX", "NVDA", "META", "JPM", "GS"];
const TRADERS = ["JSMITH", "ABROWN", "MJONES", "KLEE", "RPATEL", "TNGUYEN", "OCONNOR"];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateRandomTrade", () => {
  it("draws side, symbol and trader from the expected sets across many runs", () => {
    for (let i = 0; i < 200; i++) {
      const trade = generateRandomTrade();
      expect(["BUY", "SELL"]).toContain(trade.side);
      expect(SYMBOLS).toContain(trade.symbol);
      expect(TRADERS).toContain(trade.trader);
    }
  });

  it("generates a quantity within range and rounded to a step of 10", () => {
    for (let i = 0; i < 200; i++) {
      const { quantity } = generateRandomTrade();
      expect(quantity).toBeGreaterThanOrEqual(50);
      expect(quantity).toBeLessThanOrEqual(10_000);
      expect(quantity % 10).toBe(0);
    }
  });

  it("generates a price within range with at most 2 decimal places", () => {
    for (let i = 0; i < 200; i++) {
      const { price } = generateRandomTrade();
      expect(price).toBeGreaterThanOrEqual(10);
      expect(price).toBeLessThanOrEqual(900);
      expect(price).toBeCloseTo(Number(price.toFixed(2)), 10);
    }
  });

  it("produces the minimum quantity and price at the low end of the random range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const trade = generateRandomTrade();

    expect(trade.side).toBe("BUY");
    expect(trade.symbol).toBe(SYMBOLS[0]);
    expect(trade.trader).toBe(TRADERS[0]);
    expect(trade.quantity).toBe(50);
    expect(trade.price).toBe(10);
  });

  it("produces the maximum quantity and price at the high end of the random range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);

    const trade = generateRandomTrade();

    expect(trade.side).toBe("SELL");
    expect(trade.quantity).toBe(10_000);
    expect(trade.price).toBeCloseTo(900, 2);
  });
});
