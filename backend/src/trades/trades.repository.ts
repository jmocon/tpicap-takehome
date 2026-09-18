import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AmendTradeInput, CreateTradeInput, TradeRow, TradeStatus } from "./trades.types.js";

export interface TradeFilters {
  symbol?: string;
  trader?: string;
  side?: "BUY" | "SELL";
  status?: TradeStatus;
}

export const SORTABLE_FIELDS = ["symbol", "quantity", "price", "trader", "tradeDate", "status"] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];

export interface SortSpec {
  field: SortField;
  direction: "asc" | "desc";
}

const SORT_COLUMN: Record<SortField, string> = {
  symbol: "symbol",
  quantity: "quantity",
  price: "price",
  trader: "trader",
  tradeDate: "trade_date",
  status: "status",
};

/** Single source of truth for the insert shape — shared with the seed scripts. */
export const INSERT_TRADE_SQL = `
  INSERT INTO trades (id, symbol, side, quantity, price, trader, book, counterparty, trade_date, status)
  VALUES (@id, @symbol, @side, @quantity, @price, @trader, @book, @counterparty, @tradeDate, @status)
`;

export function generateTradeId(): string {
  return `TRD-${randomUUID().split("-")[0]!.toUpperCase()}`;
}

/**
 * SQL LIKE treats `%` and `_` as wildcards. Escape any literal occurrences
 * (plus the escape character itself) in user-supplied filter text before
 * wrapping it in `%...%`, so a search for e.g. `50%` or `foo_bar` matches
 * those literal characters rather than acting as a wildcard.
 */
function escapeLikeWildcards(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Builds a `%...%` LIKE pattern for a case-insensitive substring match. */
function containsPattern(value: string): string {
  return `%${escapeLikeWildcards(value)}%`;
}

export class TradesRepository {
  constructor(private readonly db: DatabaseSync) {}

  list(filters: TradeFilters, sort?: SortSpec): TradeRow[] {
    const clauses: string[] = [];
    const params: Record<string, string> = {};

    if (filters.symbol) {
      // SQLite's LIKE is case-insensitive for ASCII by default, which also
      // covers this field's case-insensitivity without an explicit upper/lower call.
      clauses.push("symbol LIKE @symbol ESCAPE '\\'");
      params.symbol = containsPattern(filters.symbol);
    }
    if (filters.trader) {
      clauses.push("trader LIKE @trader ESCAPE '\\'");
      params.trader = containsPattern(filters.trader);
    }
    if (filters.side) {
      clauses.push("side = @side");
      params.side = filters.side;
    }
    if (filters.status) {
      clauses.push("status = @status");
      params.status = filters.status;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const column = sort ? SORT_COLUMN[sort.field] : "trade_date";
    const direction = sort?.direction === "asc" ? "ASC" : "DESC";

    const rows = this.db
      .prepare(`SELECT * FROM trades ${where} ORDER BY ${column} ${direction}`)
      .all(params);
    return rows as unknown as TradeRow[];
  }

  count(): number {
    const { count } = this.db.prepare("SELECT COUNT(*) as count FROM trades").get() as {
      count: number;
    };
    return count;
  }

  findById(id: string): TradeRow | undefined {
    const row = this.db.prepare("SELECT * FROM trades WHERE id = ?").get(id);
    return row as TradeRow | undefined;
  }

  create(input: CreateTradeInput): TradeRow {
    const id = generateTradeId();

    this.db.prepare(INSERT_TRADE_SQL).run({
      id,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      price: input.price,
      trader: input.trader,
      book: input.book ?? null,
      counterparty: input.counterparty ?? null,
      tradeDate: input.tradeDate ?? new Date().toISOString(),
      status: "ACTIVE",
    });

    return this.findById(id)!;
  }

  /**
   * A single UPDATE ... RETURNING with COALESCE merges the partial input with
   * whatever's already stored and hands back the post-update row, avoiding the
   * pre-fetch + post-fetch a naive read-modify-write-then-reread would need.
   */
  amend(id: string, input: AmendTradeInput): TradeRow | undefined {
    const row = this.db
      .prepare(
        `UPDATE trades
         SET symbol = COALESCE(@symbol, symbol),
             side = COALESCE(@side, side),
             quantity = COALESCE(@quantity, quantity),
             price = COALESCE(@price, price),
             trader = COALESCE(@trader, trader),
             book = COALESCE(@book, book),
             counterparty = COALESCE(@counterparty, counterparty),
             trade_date = COALESCE(@tradeDate, trade_date),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = @id
         RETURNING *`,
      )
      .get({
        id,
        symbol: input.symbol ?? null,
        side: input.side ?? null,
        quantity: input.quantity ?? null,
        price: input.price ?? null,
        trader: input.trader ?? null,
        book: input.book ?? null,
        counterparty: input.counterparty ?? null,
        tradeDate: input.tradeDate ?? null,
      });

    return row as TradeRow | undefined;
  }

  cancel(id: string): TradeRow | undefined {
    const row = this.db
      .prepare(
        `UPDATE trades
         SET status = 'CANCELLED', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?
         RETURNING *`,
      )
      .get(id);

    return row as TradeRow | undefined;
  }
}
