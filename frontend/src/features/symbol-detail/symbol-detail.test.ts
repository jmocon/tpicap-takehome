import { describe, expect, it } from "vitest";
import { makeTrade } from "../trade-blotter/trade-fixtures";
import { getDistinctSymbols } from "./symbol-detail";

describe("getDistinctSymbols", () => {
  it("dedupes and alphabetically sorts symbols", () => {
    const trades = [
      makeTrade({ symbol: "MSFT" }),
      makeTrade({ symbol: "AAPL" }),
      makeTrade({ symbol: "MSFT" }),
      makeTrade({ symbol: "GOOGL" }),
    ];

    expect(getDistinctSymbols(trades)).toEqual(["AAPL", "GOOGL", "MSFT"]);
  });

  it("returns an empty list for no trades", () => {
    expect(getDistinctSymbols([])).toEqual([]);
  });
});
