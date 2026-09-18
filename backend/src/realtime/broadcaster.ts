import type { TradeEvent } from "./events.js";

export interface Broadcaster {
  publish(event: TradeEvent): void;
}

export const noopBroadcaster: Broadcaster = {
  publish() {
    // intentionally does nothing — used where no live listeners exist (e.g. tests)
  },
};
