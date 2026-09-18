import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "../trades/trades.repository.js";
import { TradesService } from "../trades/trades.service.js";
import { TradesController } from "../trades/trades.controller.js";
import { noopBroadcaster } from "../realtime/broadcaster.js";
import { AuditRepository } from "../audit/audit.repository.js";
import { PositionsRepository } from "../positions/positions.repository.js";
import { PositionsService } from "../positions/positions.service.js";
import { PositionsController } from "../positions/positions.controller.js";
import { UsersRepository } from "./users.repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { hashPassword } from "./password.js";
import { TEST_JWT_SECRET } from "../test-support/auth-test-support.js";

function buildApp() {
  const db = createTestDb();
  const tradesRepository = new TradesRepository(db);
  const auditRepository = new AuditRepository(db);
  const tradesService = new TradesService(tradesRepository, noopBroadcaster, auditRepository);
  const tradesController = new TradesController(tradesService, auditRepository);
  const positionsController = new PositionsController(new PositionsService(new PositionsRepository(db)));

  const usersRepository = new UsersRepository(db);
  usersRepository.create("trader1", hashPassword("trader1pass"));
  const authService = new AuthService(usersRepository, TEST_JWT_SECRET);
  const authController = new AuthController(authService);

  return createApp({
    tradesController,
    positionsController,
    authController,
    corsOrigin: "*",
    jwtSecret: TEST_JWT_SECRET,
  });
}

describe("auth routes", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it("logs in a seeded user and returns a usable token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "trader1", password: "trader1pass" })
      .expect(200);

    expect(res.body.data.user).toEqual({ id: expect.any(String), username: "trader1" });
    expect(typeof res.body.data.token).toBe("string");

    // The returned token should actually work against a protected route.
    await request(app)
      .get("/trades")
      .set("Authorization", `Bearer ${res.body.data.token}`)
      .expect(200);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "trader1", password: "wrong-password" })
      .expect(401);

    expect(res.body.error.message).toMatch(/invalid username or password/i);
  });

  it("rejects an unknown username with 401 and the same message as a wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "nobody", password: "whatever" })
      .expect(401);

    expect(res.body.error.message).toMatch(/invalid username or password/i);
  });

  it("rejects an invalid payload with 400", async () => {
    await request(app).post("/auth/login").send({ username: "" }).expect(400);
  });

  it("never gates /health, even with no token", async () => {
    await request(app).get("/health").expect(200);
  });
});
