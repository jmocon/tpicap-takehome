import type { Trade } from "../trades/trades.types.js";

export type TradeEventType = "trade.created" | "trade.amended" | "trade.cancelled";

export interface TradeEvent {
  type: TradeEventType;
  trade: Trade;
}
