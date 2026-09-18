import type { Trade } from "../types/trade";

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
    socket = new WebSocket(WS_URL);
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
