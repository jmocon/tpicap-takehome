import type { DatabaseSync } from "node:sqlite";
import { generateTradeId, INSERT_TRADE_SQL } from "../../trades/trades.repository.js";

/**
 * Large randomized dataset generator — exercises the blotter at realistic
 * volume (sorting/filtering/scroll). Output is expected to differ between runs.
 */
const SYMBOLS = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN", "NFLX", "NVDA", "META", "JPM", "GS"];
const TRADERS = ["JSMITH", "ABROWN", "MJONES", "KLEE", "RPATEL", "TNGUYEN", "OCONNOR"];
const BOOKS = ["EQUITIES_UK", "EQUITIES_US", "TECH_GROWTH", "GLOBAL_MACRO"];
const COUNTERPARTIES = ["Goldman Sachs", "JP Morgan", "Morgan Stanley", "Barclays", "Citi", "UBS"];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomTradeDate(): string {
  const start = new Date("2026-08-01T00:00:00Z").getTime();
  const end = new Date("2026-09-18T00:00:00Z").getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
}

export function seedMock(db: DatabaseSync, count = 300): void {
  const insert = db.prepare(INSERT_TRADE_SQL);

  const rows = Array.from({ length: count }, () => ({
    id: generateTradeId(),
    symbol: pick(SYMBOLS),
    side: Math.random() > 0.5 ? "BUY" : "SELL",
    quantity: Math.round((50 + Math.random() * 9950) / 10) * 10,
    price: Math.round(Math.random() * 90000 + 1000) / 100,
    trader: pick(TRADERS),
    book: pick(BOOKS),
    counterparty: pick(COUNTERPARTIES),
    tradeDate: randomTradeDate(),
    status: Math.random() < 0.1 ? "CANCELLED" : "ACTIVE",
  }));

  // node:sqlite's DatabaseSync has no `.transaction()` helper (unlike better-sqlite3) —
  // wrap the batch insert in an explicit transaction instead.
  db.exec("BEGIN");
  try {
    for (const row of rows) insert.run(row);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  console.log(`Inserted ${count} mock trades.`);
}
