import { beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "./trades.repository.js";

describe("TradesRepository", () => {
  let db: DatabaseSync;
  let repository: TradesRepository;

  beforeEach(() => {
    db = createTestDb();
    repository = new TradesRepository(db);
  });

  it("creates and retrieves a trade", () => {
    const created = repository.create({
      symbol: "AAPL",
      side: "BUY",
      quantity: 100,
      price: 150.5,
      trader: "JSMITH",
      tradeDate: "2026-01-01T00:00:00.000Z",
    });

    expect(created.status).toBe("ACTIVE");
    expect(repository.findById(created.id)).toEqual(created);
  });

  it("filters by symbol and status", () => {
    repository.create({ symbol: "AAPL", side: "BUY", quantity: 1, price: 1, trader: "A", tradeDate: "2026-01-01T00:00:00.000Z" });
    const msft = repository.create({ symbol: "MSFT", side: "SELL", quantity: 1, price: 1, trader: "B", tradeDate: "2026-01-01T00:00:00.000Z" });
    repository.cancel(msft.id);

    const active = repository.list({ status: "ACTIVE" });
    expect(active.map((row) => row.symbol)).toEqual(["AAPL"]);

    const msftOnly = repository.list({ symbol: "msft" });
    expect(msftOnly).toHaveLength(1);
  });

  it("sorts by the requested field and direction", () => {
    repository.create({ symbol: "AAPL", side: "BUY", quantity: 1, price: 300, trader: "A", tradeDate: "2026-01-01T00:00:00.000Z" });
    repository.create({ symbol: "MSFT", side: "BUY", quantity: 1, price: 100, trader: "B", tradeDate: "2026-01-01T00:00:00.000Z" });

    const ascByPrice = repository.list({}, { field: "price", direction: "asc" });
    expect(ascByPrice.map((row) => row.symbol)).toEqual(["MSFT", "AAPL"]);
  });

  it("amends fields that are provided and leaves the rest untouched", () => {
    const created = repository.create({ symbol: "AAPL", side: "BUY", quantity: 100, price: 150, trader: "JSMITH", tradeDate: "2026-01-01T00:00:00.000Z" });

    const amended = repository.amend(created.id, { quantity: 200 });

    expect(amended?.quantity).toBe(200);
    expect(amended?.symbol).toBe("AAPL");
  });

  it("returns undefined when amending or cancelling a missing trade", () => {
    expect(repository.amend("missing", { quantity: 1 })).toBeUndefined();
    expect(repository.cancel("missing")).toBeUndefined();
  });
});
