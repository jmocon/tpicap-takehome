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
}

export type AmendTradeInput = Partial<CreateTradeInput>;
