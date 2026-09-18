import express, { type Express } from "express";
import { corsMiddleware } from "./middleware/cors.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authMiddleware } from "./middleware/auth.js";
import { tradesRoutes } from "./trades/trades.routes.js";
import type { TradesController } from "./trades/trades.controller.js";
import { positionsRoutes } from "./positions/positions.routes.js";
import type { PositionsController } from "./positions/positions.controller.js";
import { authRoutes } from "./auth/auth.routes.js";
import type { AuthController } from "./auth/auth.controller.js";

export interface AppDeps {
  tradesController: TradesController;
  positionsController: PositionsController;
  authController: AuthController;
  corsOrigin: string;
  jwtSecret: string;
}

export function createApp({
  tradesController,
  positionsController,
  authController,
  corsOrigin,
  jwtSecret,
}: AppDeps): Express {
  const app = express();

  app.use(corsMiddleware(corsOrigin));
  app.use(express.json());
  app.use(requestLogger);

  // Public: never gated. /health for infra checks, /auth/login is how a
  // client gets a token in the first place — both respond without calling
  // next(), so they never reach authMiddleware below.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", authRoutes(authController));

  app.use(authMiddleware(jwtSecret));

  app.use("/trades", tradesRoutes(tradesController));
  // Top-level, not nested under /trades — a position is a derived view across
  // trades for a symbol, not a sub-resource of one trade.
  app.use("/positions", positionsRoutes(positionsController));

  app.use(errorHandler);

  return app;
}
