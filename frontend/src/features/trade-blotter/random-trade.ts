import type { CreateTradeInput, TradeSide } from "../../types/trade";

// Local to the frontend on purpose — mirrors (but does not import) the
// backend's demo/seed lists in backend/src/db/seeds/mock-seed.ts. Keeping
// these separate avoids reaching across the frontend/backend boundary.
const SYMBOLS = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN", "NFLX", "NVDA", "META", "JPM", "GS"];
const TRADERS = ["JSMITH", "ABROWN", "MJONES", "KLEE", "RPATEL", "TNGUYEN", "OCONNOR"];

const MIN_QUANTITY = 50;
const MAX_QUANTITY = 10_000;
const QUANTITY_STEP = 10;

const MIN_PRICE = 10;
const MAX_PRICE = 900;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomSide(): TradeSide {
  return Math.random() < 0.5 ? "BUY" : "SELL";
}

// Rounded to a clean step so simulated quantities read like real order sizes
// rather than arbitrary floats.
function randomQuantity(): number {
  const raw = MIN_QUANTITY + Math.random() * (MAX_QUANTITY - MIN_QUANTITY);
  return Math.round(raw / QUANTITY_STEP) * QUANTITY_STEP;
}

function randomPrice(): number {
  const raw = MIN_PRICE + Math.random() * (MAX_PRICE - MIN_PRICE);
  return Math.round(raw * 100) / 100;
}

/** Generates one plausible, random BUY/SELL trade for the "Simulate Trade" demo button. */
export function generateRandomTrade(): CreateTradeInput {
  return {
    symbol: pick(SYMBOLS),
    side: randomSide(),
    quantity: randomQuantity(),
    price: randomPrice(),
    trader: pick(TRADERS),
  };
}
