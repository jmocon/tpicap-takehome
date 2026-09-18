import { rowToTrade, type Trade } from "../trades/trades.types.js";
import { computeFifoPnl } from "./fifo-pnl.js";
import type { PositionsRepository } from "./positions.repository.js";
import type { Position } from "./positions.types.js";

function groupBySymbol(trades: Trade[]): Map<string, Trade[]> {
  const bySymbol = new Map<string, Trade[]>();
  for (const trade of trades) {
    const existing = bySymbol.get(trade.symbol);
    if (existing) existing.push(trade);
    else bySymbol.set(trade.symbol, [trade]);
  }
  return bySymbol;
}

export class PositionsService {
  constructor(private readonly repository: PositionsRepository) {}

  /**
   * Recomputed fresh from the active-trade set on every call — there's no
   * cache to invalidate, so a cancel is reflected immediately on the next
   * request with zero extra bookkeeping.
   */
  list(): Position[] {
    const trades = this.repository.listActiveTradesChronological().map(rowToTrade);
    const bySymbol = groupBySymbol(trades);

    const positions: Position[] = [];
    for (const [symbol, symbolTrades] of bySymbol) {
      const { realizedPnl, openLots } = computeFifoPnl(symbolTrades);

      const netQuantity = openLots.reduce(
        (sum, lot) => sum + (lot.side === "BUY" ? lot.quantity : -lot.quantity),
        0,
      );
      const openQuantity = openLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const avgOpenPrice =
        openQuantity > 0 ? openLots.reduce((sum, lot) => sum + lot.quantity * lot.price, 0) / openQuantity : 0;

      // No real market-data feed exists for this exercise — the symbol's most
      // recent (active) trade price is used as a documented proxy for "last price".
      const lastPrice = symbolTrades[symbolTrades.length - 1]!.price;

      // Works uniformly for both long (positive netQuantity) and short
      // (negative netQuantity) positions: a short benefits when lastPrice
      // falls below avgOpenPrice, and the sign of netQuantity handles that.
      // `+ 0` normalizes a `-0` result (e.g. a flat short at its open price)
      // to `0` so callers never see the JS negative-zero oddity.
      const unrealizedPnl = netQuantity * (lastPrice - avgOpenPrice) + 0;

      positions.push({
        symbol,
        netQuantity,
        avgOpenPrice,
        lastPrice,
        realizedPnl,
        unrealizedPnl,
        totalPnl: realizedPnl + unrealizedPnl,
      });
    }

    return positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }
}
