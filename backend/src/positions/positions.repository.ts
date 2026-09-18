import type { DatabaseSync } from "node:sqlite";
import type { TradeRow } from "../trades/trades.types.js";

export class PositionsRepository {
  constructor(private readonly db: DatabaseSync) {}

  /**
   * Only ACTIVE trades — a cancelled trade never happened as far as position
   * and P&L math is concerned. Ordered oldest-first by trade date, with
   * `created_at` (then `id`) as tiebreakers since `id` is a random UUID
   * fragment, not chronological, and `trade_date` alone isn't guaranteed
   * unique. This ordering is exactly what `computeFifoPnl` requires as input.
   */
  listActiveTradesChronological(): TradeRow[] {
    const rows = this.db
      .prepare("SELECT * FROM trades WHERE status = 'ACTIVE' ORDER BY trade_date ASC, created_at ASC, id ASC")
      .all();
    return rows as unknown as TradeRow[];
  }
}
