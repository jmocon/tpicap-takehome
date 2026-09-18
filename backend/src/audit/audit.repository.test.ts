import { beforeEach, describe, expect, it } from "vitest";
import { AuditRepository } from "./audit.repository.js";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "../trades/trades.repository.js";

describe("AuditRepository", () => {
  let auditRepository: AuditRepository;
  let tradesRepository: TradesRepository;
  let tradeId: string;

  beforeEach(() => {
    const db = createTestDb();
    auditRepository = new AuditRepository(db);
    tradesRepository = new TradesRepository(db);
    tradeId = tradesRepository.create({
      symbol: "AAPL",
      side: "BUY",
      quantity: 10,
      price: 100,
      trader: "JSMITH",
    }).id;
  });

  it("returns an empty list for a trade with no audit history", () => {
    expect(auditRepository.listByTradeId(tradeId)).toEqual([]);
  });

  it("round-trips a recorded entry", () => {
    auditRepository.record({
      tradeId,
      action: "AMEND",
      changes: { quantity: { old: 10, new: 20 } },
    });

    const entries = auditRepository.listByTradeId(tradeId);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      tradeId,
      action: "AMEND",
      changes: { quantity: { old: 10, new: 20 } },
    });
    expect(entries[0]!.changedAt).toBeDefined();
  });

  it("orders multiple entries newest first", () => {
    auditRepository.record({ tradeId, action: "AMEND", changes: { quantity: { old: 10, new: 20 } } });
    auditRepository.record({ tradeId, action: "AMEND", changes: { quantity: { old: 20, new: 30 } } });
    auditRepository.record({ tradeId, action: "CANCEL", changes: { status: { old: "ACTIVE", new: "CANCELLED" } } });

    const entries = auditRepository.listByTradeId(tradeId);
    expect(entries.map((entry) => entry.action)).toEqual(["CANCEL", "AMEND", "AMEND"]);
    expect(entries.map((entry) => (entry.changes.quantity as { new: number } | undefined)?.new)).toEqual([
      undefined,
      30,
      20,
    ]);
  });

  it("only returns entries for the requested trade", () => {
    const otherTradeId = tradesRepository.create({
      symbol: "MSFT",
      side: "SELL",
      quantity: 5,
      price: 50,
      trader: "BJONES",
    }).id;

    auditRepository.record({ tradeId, action: "AMEND", changes: { quantity: { old: 10, new: 20 } } });
    auditRepository.record({ tradeId: otherTradeId, action: "CANCEL", changes: { status: { old: "ACTIVE", new: "CANCELLED" } } });

    const entries = auditRepository.listByTradeId(tradeId);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.tradeId).toBe(tradeId);
  });
});
