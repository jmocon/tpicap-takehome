import { createServer } from "node:http";
import { loadEnv } from "./config/env.js";
import { getDb } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { seedMock } from "./db/seeds/mock-seed.js";
import { TradesRepository } from "./trades/trades.repository.js";
import { TradesService } from "./trades/trades.service.js";
import { TradesController } from "./trades/trades.controller.js";
import { createWsServer } from "./realtime/ws-server.js";
import { createApp } from "./app.js";
import { logger } from "./shared/logger.js";

const env = loadEnv();
const db = getDb(env.databaseFile);
runMigrations(db);

const repository = new TradesRepository(db);
if (repository.count() === 0) {
  logger.info("No trades found on startup — generating a randomized dataset");
  seedMock(db);
}

const httpServer = createServer();
const broadcaster = createWsServer(httpServer);

const service = new TradesService(repository, broadcaster);
const controller = new TradesController(service);

const app = createApp({ tradesController: controller, corsOrigin: env.corsOrigin });
httpServer.on("request", app);

httpServer.listen(env.port, () => {
  logger.info(`Backend listening on port ${env.port}`, { databaseFile: env.databaseFile });
});
