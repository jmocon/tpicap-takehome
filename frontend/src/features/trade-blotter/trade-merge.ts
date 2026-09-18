import type { TradeQuery } from "../../api/trades-api";
import type { Trade } from "../../types/trade";

/**
 * Client-side mirror of the backend's list query, used to fold a live
 * WebSocket event into the already-loaded list.
 *
 * Why merge locally instead of refetching on every event: the blotter is the
 * app's hot path (Auto Simulate can fire every 500ms, and every connected
 * client sees every event), so refetch-per-event would turn one write into N
 * list queries across clients. Positions can afford that — it's a single
 * aggregate — but the trade list can't. The cost is that the predicate and
 * comparator below duplicate `trades.repository.ts`'s WHERE/ORDER BY, the
 * same deliberate trade-off already documented for form validation.
 *
 * The one semantic that's easy to get wrong: `symbol` and `trader` are
 * case-insensitive *substring* matches server-side (SQLite `LIKE '%x%'`,
 * which is case-insensitive for ASCII), not equality.
 */
export function matchesQuery(trade: Trade, query: TradeQuery): boolean {
  if (query.symbol && !containsIgnoreCase(trade.symbol, query.symbol)) return false;
  if (query.trader && !containsIgnoreCase(trade.trader, query.trader)) return false;
  if (query.side && trade.side !== query.side) return false;
  if (query.status && trade.status !== query.status) return false;
  return true;
}

function containsIgnoreCase(value: string, needle: string): boolean {
  return value.toLowerCase().includes(needle.toLowerCase());
}

function compareValues(left: string | number, right: string | number): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  // Plain relational comparison, not localeCompare: SQLite's default BINARY
  // collation orders by code point, which is what the server-sorted page we
  // are merging into was ordered by.
  const a = String(left);
  const b = String(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Mirrors `ORDER BY <column> ASC|DESC`, defaulting to trade_date DESC. */
export function compareTrades(a: Trade, b: Trade, query: TradeQuery): number {
  const field = query.sortBy ?? "tradeDate";
  const direction = query.sortDir === "asc" ? 1 : -1;
  return compareValues(a[field], b[field]) * direction;
}

/**
 * Applies one live trade event to the current list, honouring the active
 * filters and sort order:
 *
 * - a trade that doesn't match the filters never enters the list, and *leaves*
 *   it if it no longer matches (e.g. a cancel while filtered to ACTIVE);
 * - a matching trade replaces any existing row with the same id;
 * - the result is re-sorted with the active comparator, so a new trade lands
 *   at its correct position rather than always at the top.
 *
 * Returns the original array reference when nothing changed, so React can skip
 * the re-render for events irrelevant to the current view.
 */
export function mergeTradeEvent(trades: Trade[], incoming: Trade, query: TradeQuery): Trade[] {
  const withoutIncoming = trades.filter((trade) => trade.id !== incoming.id);
  const wasPresent = withoutIncoming.length !== trades.length;

  if (!matchesQuery(incoming, query)) {
    return wasPresent ? withoutIncoming : trades;
  }

  // Array.prototype.sort is stable, so rows the comparator considers equal
  // keep the relative order the server gave them.
  return [...withoutIncoming, incoming].sort((a, b) => compareTrades(a, b, query));
}
