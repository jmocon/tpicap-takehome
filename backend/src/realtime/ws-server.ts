import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { tryVerifyToken } from "../auth/jwt.js";
import type { Broadcaster } from "./broadcaster.js";
import type { TradeEvent } from "./events.js";
import { logger } from "../shared/logger.js";

/**
 * Listens on a dedicated path (rather than every upgrade request) so a
 * reverse proxy in front of this service can route by path instead of
 * having to disambiguate "/" between the WS upgrade and the frontend's
 * index route.
 */
export const WS_PATH = "/ws";

/** WS close code used when a connection fails auth — 4xxx is the reserved application-use range. */
const WS_CLOSE_UNAUTHORIZED = 4401;

/**
 * Express middleware (including `authMiddleware`) never runs on the raw HTTP
 * upgrade request `ws` handles, so auth for this transport is checked here
 * instead, via a `?token=` query param on the connection URL. This is a
 * deliberate simplification vs. a full WS auth handshake (e.g. a first
 * "auth" frame) — acceptable for this app's "simple login gate" scope.
 */
export function createWsServer(httpServer: Server, jwtSecret: string): Broadcaster {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");
    const user = token ? tryVerifyToken(token, jwtSecret) : undefined;

    if (!user) {
      logger.warn("WS connection rejected: missing or invalid token");
      socket.close(WS_CLOSE_UNAUTHORIZED, "Unauthorized");
      return;
    }

    logger.info("WS client connected", { clients: wss.clients.size, user: user.username });
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
