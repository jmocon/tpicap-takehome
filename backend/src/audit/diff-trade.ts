import type { Trade } from "../trades/trades.types.js";
import type { ChangeSet } from "./audit.types.js";

/** Fixed field list a trade amendment can touch — mirrors `AmendTradeInput`. */
const DIFF_FIELDS = [
  "symbol",
  "side",
  "quantity",
  "price",
  "trader",
  "book",
  "counterparty",
  "tradeDate",
] as const satisfies readonly (keyof Trade)[];

/** Pure field-by-field diff between two versions of a trade. A field only appears in
 * the result if it actually changed, so a no-op amend produces an empty `ChangeSet`. */
export function diffTrade(before: Trade, after: Trade): ChangeSet {
  const changes: ChangeSet = {};
  for (const field of DIFF_FIELDS) {
    const oldValue = before[field] ?? null;
    const newValue = after[field] ?? null;
    if (oldValue !== newValue) {
      changes[field] = { old: oldValue, new: newValue };
    }
  }
  return changes;
}
