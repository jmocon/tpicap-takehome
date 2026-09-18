import { httpClient } from "./http-client";
import type { AmendTradeInput, CreateTradeInput, Trade } from "../types/trade";

export interface TradeQuery {
  symbol?: string;
  trader?: string;
  side?: "BUY" | "SELL";
  status?: "ACTIVE" | "CANCELLED";
  sortBy?: "symbol" | "quantity" | "price" | "trader" | "tradeDate" | "status";
  sortDir?: "asc" | "desc";
}

function toQueryString(query: TradeQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const tradesApi = {
  list: (query: TradeQuery = {}) => httpClient.get<Trade[]>(`/trades${toQueryString(query)}`),
  create: (input: CreateTradeInput) => httpClient.post<Trade>("/trades", input),
  amend: (id: string, input: AmendTradeInput) => httpClient.patch<Trade>(`/trades/${id}`, input),
  cancel: (id: string) => httpClient.post<Trade>(`/trades/${id}/cancel`),
};
