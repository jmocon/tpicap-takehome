import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { Broadcaster } from "./broadcaster.js";
import type { TradeEvent } from "./events.js";
import { logger } from "../shared/logger.js";

/**
 * Listens on a dedicated path (rather than every upgrade request on the
 * server) so a reverse proxy in front of this service can route by path
 * instead of having to disambiguate "/" between the WS upgrade and the
 * frontend's index route.
 */
export const WS_PATH = "/ws";

export function createWsServer(httpServer: Server): Broadcaster {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });

  wss.on("connection", (socket) => {
    logger.info("WS client connected", { clients: wss.clients.size });
    socket.on("close", () => {
      logger.info("WS client disconnected", { clients: wss.clients.size });
    });
  });

  return {
    publish(event: TradeEvent) {
      const payload = JSON.stringify(event);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    },
  };
}
