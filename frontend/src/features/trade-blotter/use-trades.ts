import { useCallback, useEffect, useState } from "react";
import { tradesApi, type TradeQuery } from "../../api/trades-api";
import type { Trade } from "../../types/trade";
import { useTradeSocket } from "./use-trade-socket";
import { mergeTradeEvent } from "./trade-merge";

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

  // The merge is filter- and sort-aware (see trade-merge.ts): a live trade
  // that doesn't match the active query must not appear in a filtered view,
  // and a matching one has to land in the right sort position rather than
  // always at the top. useTradeSocket keeps this handler in a ref, so the
  // closure always sees the current `query`.
  useTradeSocket((event) => {
    setTrades((current) => mergeTradeEvent(current, event.trade, query));
  });

  return { trades, loading, error, refresh };
}
