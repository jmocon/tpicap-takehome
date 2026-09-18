import { useCallback, useEffect, useState } from "react";
import { positionsApi } from "../../api/positions-api";
import type { Position } from "../../types/position";
import { useTradeSocket } from "../trade-blotter/use-trade-socket";

/**
 * Positions are entirely derived from trades server-side (no caching there
 * either — see `PositionsService.list`), so the simplest way to keep this
 * view live is to just refetch on any trade event, the same socket the
 * blotter already subscribes to.
 */
export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  // Exposed so the page can show "as of HH:MM:SS". The socket subscription
  // below keeps the numbers live, but a dropped socket is invisible: P&L that
  // has silently stopped updating looks exactly like P&L that hasn't moved.
  // The timestamp is what makes the difference legible.
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setPositions(await positionsApi.list());
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount is synchronizing with the backend (an external
    // system) — the documented legitimate case for setState-in-effect.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh();
  }, [refresh]);

  useTradeSocket(() => {
    refresh();
  });

  return { positions, loading, error, lastUpdatedAt, refresh };
}
