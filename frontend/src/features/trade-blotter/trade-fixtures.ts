import type { Trade } from "../../types/trade";

export function makeTrade(overrides: Partial<Trade> = {}): Trade {
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
