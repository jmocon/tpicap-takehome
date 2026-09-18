import type { TradeSide } from "../trades/trades.types.js";

/** The subset of a trade this algorithm actually needs — kept narrow so it stays a pure function of plain data. */
export interface FifoTradeInput {
  side: TradeSide;
  quantity: number;
  price: number;
}

/** An unmatched slice of a past trade still open, waiting for an opposite-side trade to close it. */
export interface OpenLot {
  side: TradeSide;
  quantity: number;
  price: number;
}

export interface FifoPnlResult {
  realizedPnl: number;
  openLots: OpenLot[];
}

/**
 * Standard FIFO lot-matching for one symbol's trade history.
 *
 * Maintains a queue of open lots (one per unmatched trade or unmatched
 * remainder of a trade). Each incoming trade drains opposite-side lots off
 * the front of the queue — oldest first — realizing P&L on the matched
 * quantity, until either the trade is fully absorbed or the queue runs out
 * of opposite-side lots. Any quantity left over after that becomes a new
 * lot on the back of the queue.
 *
 * A position flip (e.g. long 10 -> sell 15) falls out of this naturally:
 * the sell drains the 10 open BUY lot (realizing P&L on 10), then the
 * remaining 5 has no opposite lot left to match, so it's pushed as a new
 * open SELL lot — no special-case "flip" branch required.
 *
 * Because lots are only ever drained from the front and a symbol's queue is
 * homogeneous in side between calls (mixed-side lots can't coexist — a new
 * lot is only pushed once the opposite side is fully drained), the trailing
 * open lots after processing all trades are always the same side.
 *
 * Assumes `trades` is already sorted chronologically (oldest first) — that's
 * the caller's/repository's responsibility, not this function's.
 */
export function computeFifoPnl(trades: FifoTradeInput[]): FifoPnlResult {
  const lots: OpenLot[] = [];
  let realizedPnl = 0;

  for (const trade of trades) {
    let remaining = trade.quantity;

    while (remaining > 0 && lots.length > 0 && lots[0]!.side !== trade.side) {
      const lot = lots[0]!;
      const matchedQuantity = Math.min(remaining, lot.quantity);

      // A BUY lot is a long position, closed by a SELL: profit is exit - entry.
      // A SELL lot is a short position, closed by a BUY: profit is entry - exit.
      realizedPnl +=
        lot.side === "BUY"
          ? matchedQuantity * (trade.price - lot.price)
          : matchedQuantity * (lot.price - trade.price);

      lot.quantity -= matchedQuantity;
      remaining -= matchedQuantity;

      if (lot.quantity === 0) {
        lots.shift();
      }
    }

    if (remaining > 0) {
      lots.push({ side: trade.side, quantity: remaining, price: trade.price });
    }
  }

  return { realizedPnl, openLots: lots };
}
