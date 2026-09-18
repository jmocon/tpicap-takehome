import { useEffect, useRef } from "react";
import { subscribeToTradeEvents, type TradeEvent } from "../../api/trades-socket";

/** Subscribes once per mount; safe to pass an inline callback without memoizing it. */
export function useTradeSocket(onEvent: (event: TradeEvent) => void): void {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    return subscribeToTradeEvents((event) => handlerRef.current(event));
  }, []);
}
