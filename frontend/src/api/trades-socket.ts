import type { Trade } from "../types/trade";
import { getAuthToken, notifyAuthFailure } from "./auth-token";

export type TradeEventType = "trade.created" | "trade.amended" | "trade.cancelled";

export interface TradeEvent {
  type: TradeEventType;
  trade: Trade;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";
const RECONNECT_DELAY_MS = 2000;

/** Matches `WS_CLOSE_UNAUTHORIZED` in the backend's ws-server.ts. */
const WS_CLOSE_UNAUTHORIZED = 4401;

/** Subscribes to live trade events. Returns an unsubscribe function. Reconnects on drop. */
export function subscribeToTradeEvents(onEvent: (event: TradeEvent) => void): () => void {
  let socket: WebSocket | undefined;
  let stopped = false;

  function connect() {
    // Read the token fresh on every (re)connect attempt, not hoisted to the
    // outer closure, so a token that changes (login/logout) after the first
    // connect is picked up on the next reconnect rather than going stale.
    const token = getAuthToken();
    if (!token) {
      // Reconnecting without one would just be refused again every couple of
      // seconds, forever — the session is over, so say so and stay down.
      stopped = true;
      notifyAuthFailure();
      return;
    }

    socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    socket.addEventListener("message", (message) => {
      try {
        onEvent(JSON.parse(message.data as string) as TradeEvent);
      } catch {
        // ignore malformed frames
      }
    });
    socket.addEventListener("close", (event) => {
      if (stopped) return;
      // A rejected token won't start working on retry; anything else (server
      // restart, network blip, proxy timeout) is worth reconnecting through.
      if (event.code === WS_CLOSE_UNAUTHORIZED) {
        stopped = true;
        notifyAuthFailure();
        return;
      }
      setTimeout(connect, RECONNECT_DELAY_MS);
    });
  }

  connect();

  return () => {
    stopped = true;
    socket?.close();
  };
}
