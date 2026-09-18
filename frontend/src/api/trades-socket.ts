import type { Trade } from "../types/trade";
import { getAuthToken } from "./auth-token";

export type TradeEventType = "trade.created" | "trade.amended" | "trade.cancelled";

export interface TradeEvent {
  type: TradeEventType;
  trade: Trade;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";
const RECONNECT_DELAY_MS = 2000;

/** Subscribes to live trade events. Returns an unsubscribe function. Reconnects on drop. */
export function subscribeToTradeEvents(onEvent: (event: TradeEvent) => void): () => void {
  let socket: WebSocket | undefined;
  let stopped = false;

  function connect() {
    // Read the token fresh on every (re)connect attempt, not hoisted to the
    // outer closure, so a token that changes (login/logout) after the first
    // connect is picked up on the next reconnect rather than going stale.
    const token = getAuthToken();
    const url = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;
    socket = new WebSocket(url);
    socket.addEventListener("message", (message) => {
      try {
        onEvent(JSON.parse(message.data as string) as TradeEvent);
      } catch {
        // ignore malformed frames
      }
    });
    socket.addEventListener("close", () => {
      if (!stopped) setTimeout(connect, RECONNECT_DELAY_MS);
    });
  }

  connect();

  return () => {
    stopped = true;
    socket?.close();
  };
}
