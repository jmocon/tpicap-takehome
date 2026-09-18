import { beforeEach, describe, expect, it, vi } from "vitest";
import { TradesService } from "./trades.service.js";
import { TradesRepository } from "./trades.repository.js";
import { createTestDb } from "../test-support/test-db.js";
import type { Broadcaster } from "../realtime/broadcaster.js";
import type { TradeEvent } from "../realtime/events.js";

function makeBroadcaster(): Broadcaster & { publish: ReturnType<typeof vi.fn<(event: TradeEvent) => void>> } {
  return { publish: vi.fn<(event: TradeEvent) => void>() };
}

describe("TradesService", () => {
  let repository: TradesRepository;
  let broadcaster: ReturnType<typeof makeBroadcaster>;
  let service: TradesService;

  beforeEach(() => {
    repository = new TradesRepository(createTestDb());
    broadcaster = makeBroadcaster();
    service = new TradesService(repository, broadcaster);
  });

  it("creates a trade and broadcasts a trade.created event", () => {
    const trade = service.create({
      symbol: "aapl",
      side: "BUY",
      quantity: 10,
      price: 100,
      trader: "JSMITH",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });

    expect(trade.id).toBeDefined();
    expect(broadcaster.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "trade.created", trade }),
    );
  });

  it("rejects amending a cancelled trade", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 1, price: 1, trader: "A" });
    service.cancel(trade.id);

    expect(() => service.amend(trade.id, { quantity: 50 })).toThrowError(/cancelled/i);
  });

  it("rejects cancelling an already-cancelled trade", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 1, price: 1, trader: "A" });
    service.cancel(trade.id);

    expect(() => service.cancel(trade.id)).toThrowError(/already cancelled/i);
  });

  it("throws NotFoundError for a missing trade", () => {
    expect(() => service.get("TRD-MISSING")).toThrowError(/not found/i);
  });

  it("amends an active trade and broadcasts trade.amended", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 10, price: 1, trader: "A" });

    const amended = service.amend(trade.id, { quantity: 999 });

    expect(amended.quantity).toBe(999);
    expect(broadcaster.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "trade.amended" }),
    );
  });
});
