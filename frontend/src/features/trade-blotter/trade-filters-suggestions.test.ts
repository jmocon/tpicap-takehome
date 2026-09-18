import { describe, expect, it } from "vitest";
import { filterSuggestions } from "./trade-filters-suggestions";

describe("filterSuggestions", () => {
  it("matches case-insensitively by substring", () => {
    expect(filterSuggestions(["AAPL", "MSFT", "GOOGL"], "aap")).toEqual(["AAPL"]);
  });

  it("returns nothing for an empty or whitespace-only query", () => {
    expect(filterSuggestions(["AAPL", "MSFT"], "")).toEqual([]);
    expect(filterSuggestions(["AAPL", "MSFT"], "   ")).toEqual([]);
  });

  it("dedupes repeated values, keeping first-seen order", () => {
    expect(filterSuggestions(["AAPL", "MSFT", "AAPL", "AAPL"], "a")).toEqual(["AAPL"]);
  });

  it("caps results at the given limit", () => {
    const values = ["A1", "A2", "A3", "A4"];
    expect(filterSuggestions(values, "a", 2)).toEqual(["A1", "A2"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterSuggestions(["AAPL", "MSFT"], "zzz")).toEqual([]);
  });
});
