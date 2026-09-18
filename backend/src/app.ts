import express, { type Express } from "express";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { tradesRoutes } from "./trades/trades.routes.js";
import type { TradesController } from "./trades/trades.controller.js";

export interface AppDeps {
  tradesController: TradesController;
  corsOrigin: string;
}

export function createApp({ tradesController, corsOrigin }: AppDeps): Express {
  const app = express();

  app.use(corsMiddleware(corsOrigin));
  app.use(express.json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/trades", tradesRoutes(tradesController));

  app.use(errorHandler);

  return app;
}
