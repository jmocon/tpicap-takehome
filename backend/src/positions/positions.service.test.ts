import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "../trades/trades.repository.js";
import { PositionsRepository } from "./positions.repository.js";
import { PositionsService } from "./positions.service.js";

describe("PositionsService", () => {
  let tradesRepository: TradesRepository;
  let service: PositionsService;

  beforeEach(() => {
    const db = createTestDb();
    tradesRepository = new TradesRepository(db);
    service = new PositionsService(new PositionsRepository(db));
  });

  it("returns one position per symbol, each computed independently", () => {
    tradesRepository.create({
      symbol: "AAPL",
      side: "BUY",
      quantity: 10,
      price: 100,
      trader: "A",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });
    tradesRepository.create({
      symbol: "AAPL",
      side: "SELL",
      quantity: 4,
      price: 120,
      trader: "A",
      tradeDate: "2026-01-02T00:00:00.000Z",
    });
    tradesRepository.create({
      symbol: "MSFT",
      side: "SELL",
      quantity: 5,
      price: 300,
      trader: "B",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });

    const positions = service.list();

    expect(positions.map((p) => p.symbol)).toEqual(["AAPL", "MSFT"]);

    const aapl = positions.find((p) => p.symbol === "AAPL")!;
    expect(aapl.netQuantity).toBe(6);
    expect(aapl.avgOpenPrice).toBe(100);
    expect(aapl.lastPrice).toBe(120);
    expect(aapl.realizedPnl).toBe(4 * (120 - 100));
    expect(aapl.unrealizedPnl).toBe(6 * (120 - 100));
    expect(aapl.totalPnl).toBe(aapl.realizedPnl + aapl.unrealizedPnl);

    const msft = positions.find((p) => p.symbol === "MSFT")!;
    expect(msft.netQuantity).toBe(-5);
    expect(msft.avgOpenPrice).toBe(300);
    expect(msft.lastPrice).toBe(300);
    expect(msft.realizedPnl).toBe(0);
    expect(msft.unrealizedPnl).toBe(0);
  });

  it("excludes a symbol entirely when all of its trades are cancelled", () => {
    const trade = tradesRepository.create({
      symbol: "TSLA",
      side: "BUY",
      quantity: 10,
      price: 200,
      trader: "A",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });
    tradesRepository.cancel(trade.id);

    const positions = service.list();

    expect(positions.find((p) => p.symbol === "TSLA")).toBeUndefined();
  });

  it("excludes only the cancelled rows when a symbol has a mix of active and cancelled trades", () => {
    tradesRepository.create({
      symbol: "NFLX",
      side: "BUY",
      quantity: 10,
      price: 400,
      trader: "A",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });
    const toCancel = tradesRepository.create({
      symbol: "NFLX",
      side: "BUY",
      quantity: 999,
      price: 1,
      trader: "A",
      tradeDate: "2026-01-02T00:00:00.000Z",
    });
    tradesRepository.cancel(toCancel.id);

    const positions = service.list();
    const nflx = positions.find((p) => p.symbol === "NFLX")!;

    expect(nflx).toBeDefined();
    // If the cancelled row were included, net quantity would be 1009 and
    // avgOpenPrice would be dragged toward 1 — neither happens here.
    expect(nflx.netQuantity).toBe(10);
    expect(nflx.avgOpenPrice).toBe(400);
    expect(nflx.lastPrice).toBe(400);
  });

  it("returns an empty list when there are no active trades", () => {
    expect(service.list()).toEqual([]);
  });
});
