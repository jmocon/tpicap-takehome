import type { DatabaseSync } from "node:sqlite";
import { INSERT_TRADE_SQL, TradesRepository } from "../../trades/trades.repository.js";

/**
 * Small, hand-curated, deterministic dataset — a clean, readable baseline
 * for demos and for integration tests to assert against. Not randomized.
 */
const INITIAL_TRADES = [
  {
    id: "TRD-100001",
    symbol: "AAPL",
    side: "BUY",
    quantity: 5000,
    price: 227.45,
    trader: "JSMITH",
    book: "EQUITIES_UK",
    counterparty: "Goldman Sachs",
    tradeDate: "2026-08-18T09:15:23Z",
    status: "ACTIVE",
  },
  {
    id: "TRD-100002",
    symbol: "MSFT",
    side: "SELL",
    quantity: 1200,
    price: 534.22,
    trader: "ABROWN",
    book: "EQUITIES_US",
    counterparty: "JP Morgan",
    tradeDate: "2026-08-18T09:18:54Z",
    status: "ACTIVE",
  },
  {
    id: "TRD-100003",
    symbol: "TSLA",
    side: "BUY",
    quantity: 800,
    price: 341.75,
    trader: "MJONES",
    book: "TECH_GROWTH",
    counterparty: "Morgan Stanley",
    tradeDate: "2026-08-18T09:20:11Z",
    status: "CANCELLED",
  },
  {
    id: "TRD-100004",
    symbol: "GOOGL",
    side: "BUY",
    quantity: 2500,
    price: 178.9,
    trader: "KLEE",
    book: "EQUITIES_US",
    counterparty: "Barclays",
    tradeDate: "2026-08-18T10:02:47Z",
    status: "ACTIVE",
  },
  {
    id: "TRD-100005",
    symbol: "NVDA",
    side: "SELL",
    quantity: 600,
    price: 128.35,
    trader: "RPATEL",
    book: "TECH_GROWTH",
    counterparty: "Citi",
    tradeDate: "2026-08-18T10:11:02Z",
    status: "ACTIVE",
  },
] as const;

export function seedInitial(db: DatabaseSync): void {
  const count = new TradesRepository(db).count();
  if (count > 0) {
    console.log(`Skipping initial seed: trades table already has ${count} row(s).`);
    return;
  }

  const insert = db.prepare(INSERT_TRADE_SQL);
  for (const trade of INITIAL_TRADES) {
    insert.run(trade);
  }

  console.log(`Inserted ${INITIAL_TRADES.length} initial trades.`);
}
