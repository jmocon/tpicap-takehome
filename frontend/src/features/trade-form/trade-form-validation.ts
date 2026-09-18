export interface TradeFormValues {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: string;
  price: string;
  trader: string;
  book: string;
  counterparty: string;
}

export type TradeFormErrors = Partial<Record<keyof TradeFormValues, string>>;

export function validateTradeForm(values: TradeFormValues): TradeFormErrors {
  const errors: TradeFormErrors = {};

  if (!values.symbol.trim()) errors.symbol = "Symbol is required";
  if (!values.trader.trim()) errors.trader = "Trader is required";

  const quantity = Number(values.quantity);
  if (!values.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be a positive number";
  }

  const price = Number(values.price);
  if (!values.price.trim() || Number.isNaN(price) || price <= 0) {
    errors.price = "Price must be a positive number";
  }

  return errors;
}
