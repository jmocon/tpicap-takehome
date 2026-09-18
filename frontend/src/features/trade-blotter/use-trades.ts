import { useCallback, useEffect, useState } from "react";
import { tradesApi, type TradeQuery } from "../../api/trades-api";
import type { Trade } from "../../types/trade";
import { useTradeSocket } from "./use-trade-socket";

export function useTrades(query: TradeQuery) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setTrades(await tradesApi.list(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    // Fetching on mount/query-change is synchronizing with the backend (an
    // external system) — the documented legitimate case for setState-in-effect.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
  }, [refresh]);

  useTradeSocket((event) => {
    setTrades((current) => {
      const index = current.findIndex((trade) => trade.id === event.trade.id);
      if (index === -1) return [event.trade, ...current];
      return current.map((trade) => (trade.id === event.trade.id ? event.trade : trade));
    });
  });

  return { trades, loading, error, refresh };
}
