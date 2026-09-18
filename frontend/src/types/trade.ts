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

export type AuditAction = "AMEND" | "CANCEL";

export interface FieldChange {
  old: unknown;
  new: unknown;
}

export interface AuditLogEntry {
  id: number;
  tradeId: string;
  action: AuditAction;
  changes: Record<string, FieldChange>;
  changedAt: string;
}
