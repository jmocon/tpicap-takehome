import type { Trade } from "../../types/trade";
import { aggregateBySymbol } from "../trade-analytics/trade-analytics";

// Distinct symbols present in a trade set, alphabetically sorted — feeds the
// symbol picker on SymbolPage.
export function getDistinctSymbols(trades: Trade[]): string[] {
  return [...new Set(trades.map((t) => t.symbol))].sort((a, b) => a.localeCompare(b));
}

// The `count` most actively-traded symbols by volume — feeds the default
// OHLC overview shown on /symbols before a symbol is selected. Reuses
// aggregateBySymbol's ranking rather than re-deriving it, and drops the
// "Other" overflow bucket (never a real symbol to chart).
export function getTopSymbolsByVolume(trades: Trade[], count: number): string[] {
  return aggregateBySymbol(trades, count)
    .filter((item) => item.label !== "Other")
    .slice(0, count)
    .map((item) => item.label);
}
