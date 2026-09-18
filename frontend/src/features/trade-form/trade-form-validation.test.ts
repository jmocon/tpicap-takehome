import { describe, expect, it } from "vitest";
import { validateTradeForm, type TradeFormValues } from "./trade-form-validation";

const VALID: TradeFormValues = {
  symbol: "AAPL",
  side: "BUY",
  quantity: "100",
  price: "150.5",
  trader: "JSMITH",
  book: "",
  counterparty: "",
};

describe("validateTradeForm", () => {
  it("passes for a fully valid form", () => {
    expect(validateTradeForm(VALID)).toEqual({});
  });

  it("requires symbol and trader", () => {
    const errors = validateTradeForm({ ...VALID, symbol: "  ", trader: "" });
    expect(errors.symbol).toBeDefined();
    expect(errors.trader).toBeDefined();
  });

  it.each(["0", "-5", "abc", ""])("rejects a non-positive quantity (%s)", (quantity) => {
    expect(validateTradeForm({ ...VALID, quantity }).quantity).toBeDefined();
  });

  it.each(["0", "-1.5", "abc", ""])("rejects a non-positive price (%s)", (price) => {
    expect(validateTradeForm({ ...VALID, price }).price).toBeDefined();
  });
});
