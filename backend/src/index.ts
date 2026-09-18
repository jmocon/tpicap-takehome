import { createServer } from "node:http";
import { AuditRepository } from "./audit/audit.repository.js";
import { loadEnv } from "./config/env.js";
import { getDb } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { seedMock } from "./db/seeds/mock-seed.js";
import { seedUsers } from "./db/seeds/users-seed.js";
import { TradesRepository } from "./trades/trades.repository.js";
import { TradesService } from "./trades/trades.service.js";
import { TradesController } from "./trades/trades.controller.js";
import { PositionsRepository } from "./positions/positions.repository.js";
import { PositionsService } from "./positions/positions.service.js";
import { PositionsController } from "./positions/positions.controller.js";
import { UsersRepository } from "./auth/users.repository.js";
import { AuthService } from "./auth/auth.service.js";
import { AuthController } from "./auth/auth.controller.js";
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

seedUsers(db);

const auditRepository = new AuditRepository(db);

const httpServer = createServer();
const broadcaster = createWsServer(httpServer, env.jwtSecret);

const service = new TradesService(repository, broadcaster, auditRepository);
const controller = new TradesController(service, auditRepository);

const positionsRepository = new PositionsRepository(db);
const positionsService = new PositionsService(positionsRepository);
const positionsController = new PositionsController(positionsService);

const usersRepository = new UsersRepository(db);
const authService = new AuthService(usersRepository, env.jwtSecret);
const authController = new AuthController(authService);

const app = createApp({
  tradesController: controller,
  positionsController,
  authController,
  corsOrigin: env.corsOrigin,
  jwtSecret: env.jwtSecret,
});
httpServer.on("request", app);

httpServer.listen(env.port, () => {
  logger.info(`Backend listening on port ${env.port}`, { databaseFile: env.databaseFile });
});
