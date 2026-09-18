import { beforeEach, describe, expect, it, vi } from "vitest";
import { TradesService } from "./trades.service.js";
import { TradesRepository } from "./trades.repository.js";
import { createTestDb } from "../test-support/test-db.js";
import type { Broadcaster } from "../realtime/broadcaster.js";
import type { TradeEvent } from "../realtime/events.js";
import type { AuditLogEntryInput, AuditLogger } from "../audit/audit-logger.js";

function makeBroadcaster(): Broadcaster & { publish: ReturnType<typeof vi.fn<(event: TradeEvent) => void>> } {
  return { publish: vi.fn<(event: TradeEvent) => void>() };
}

function makeAuditLogger(): AuditLogger & { record: ReturnType<typeof vi.fn<(entry: AuditLogEntryInput) => void>> } {
  return { record: vi.fn<(entry: AuditLogEntryInput) => void>() };
}

describe("TradesService", () => {
  let repository: TradesRepository;
  let broadcaster: ReturnType<typeof makeBroadcaster>;
  let auditLogger: ReturnType<typeof makeAuditLogger>;
  let service: TradesService;

  beforeEach(() => {
    repository = new TradesRepository(createTestDb());
    broadcaster = makeBroadcaster();
    auditLogger = makeAuditLogger();
    service = new TradesService(repository, broadcaster, auditLogger);
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

  it("records an AMEND audit entry with the changed fields on amend", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 10, price: 1, trader: "A" });

    service.amend(trade.id, { quantity: 999 });

    expect(auditLogger.record).toHaveBeenCalledWith({
      tradeId: trade.id,
      action: "AMEND",
      changes: { quantity: { old: 10, new: 999 } },
    });
  });

  it("does not record an audit entry for a no-op amend", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 10, price: 1, trader: "A" });

    service.amend(trade.id, {});

    expect(auditLogger.record).not.toHaveBeenCalled();
  });

  it("records a CANCEL audit entry with the fixed status transition", () => {
    const trade = service.create({ symbol: "AAPL", side: "BUY", quantity: 10, price: 1, trader: "A" });

    service.cancel(trade.id);

    expect(auditLogger.record).toHaveBeenCalledWith({
      tradeId: trade.id,
      action: "CANCEL",
      changes: { status: { old: "ACTIVE", new: "CANCELLED" } },
    });
  });
});
