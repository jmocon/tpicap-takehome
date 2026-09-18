export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "ACTIVE" | "CANCELLED";

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  trader: string;
  book?: string;
  counterparty?: string;
  tradeDate: string;
  status: TradeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeInput {
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  trader: string;
  book?: string;
  counterparty?: string;
  tradeDate?: string;
}

export type AmendTradeInput = Partial<
  Pick<CreateTradeInput, "symbol" | "side" | "quantity" | "price" | "trader" | "book" | "counterparty" | "tradeDate">
>;

export interface TradeRow {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  trader: string;
  book: string | null;
  counterparty: string | null;
  trade_date: string;
  status: TradeStatus;
  created_at: string;
  updated_at: string;
}

export function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    price: row.price,
    trader: row.trader,
    book: row.book ?? undefined,
    counterparty: row.counterparty ?? undefined,
    tradeDate: row.trade_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
