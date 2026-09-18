import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "../trades/trades.repository.js";
import { TradesService } from "../trades/trades.service.js";
import { TradesController } from "../trades/trades.controller.js";
import { noopBroadcaster } from "../realtime/broadcaster.js";
import { AuditRepository } from "../audit/audit.repository.js";
import { PositionsRepository } from "./positions.repository.js";
import { PositionsService } from "./positions.service.js";
import { PositionsController } from "./positions.controller.js";
import { UsersRepository } from "../auth/users.repository.js";
import { AuthService } from "../auth/auth.service.js";
import { AuthController } from "../auth/auth.controller.js";
import { signTestToken, TEST_JWT_SECRET } from "../test-support/auth-test-support.js";

function buildApp() {
  const db = createTestDb();
  const tradesRepository = new TradesRepository(db);
  const auditRepository = new AuditRepository(db);
  const tradesService = new TradesService(tradesRepository, noopBroadcaster, auditRepository);
  const tradesController = new TradesController(tradesService, auditRepository);
  const positionsController = new PositionsController(new PositionsService(new PositionsRepository(db)));
  const authController = new AuthController(new AuthService(new UsersRepository(db), TEST_JWT_SECRET));
  return createApp({
    tradesController,
    positionsController,
    authController,
    corsOrigin: "*",
    jwtSecret: TEST_JWT_SECRET,
  });
}

/** A thin supertest wrapper that attaches a valid bearer token to every call — auth itself is tested separately. */
function authed(app: Express) {
  const token = signTestToken();
  return {
    get: (path: string) => request(app).get(path).set("Authorization", `Bearer ${token}`),
    post: (path: string) => request(app).post(path).set("Authorization", `Bearer ${token}`),
  };
}

describe("positions routes", () => {
  let app: ReturnType<typeof buildApp>;
  let api: ReturnType<typeof authed>;

  beforeEach(() => {
    app = buildApp();
    api = authed(app);
  });

  it("returns an empty array when there are no trades", async () => {
    const res = await api.get("/positions").expect(200);
    expect(res.body.data).toEqual([]);
  });

  it("computes a position end-to-end from real trades created via the API", async () => {
    await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "A", tradeDate: "2026-01-01T00:00:00.000Z" })
      .expect(201);
    await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "SELL", quantity: 4, price: 120, trader: "A", tradeDate: "2026-01-02T00:00:00.000Z" })
      .expect(201);

    const res = await api.get("/positions").expect(200);

    expect(res.body.data).toEqual([
      expect.objectContaining({
        symbol: "AAPL",
        netQuantity: 6,
        avgOpenPrice: 100,
        lastPrice: 120,
        realizedPnl: 80,
        unrealizedPnl: 120,
        totalPnl: 200,
      }),
    ]);
  });

  it("recomputes fresh (no caching) when a trade is cancelled", async () => {
    const created = await api
      .post("/trades")
      .send({ symbol: "GOOG", side: "BUY", quantity: 10, price: 50, trader: "A", tradeDate: "2026-01-01T00:00:00.000Z" })
      .expect(201);

    const before = await api.get("/positions").expect(200);
    expect(before.body.data).toEqual([expect.objectContaining({ symbol: "GOOG", netQuantity: 10 })]);

    await api.post(`/trades/${created.body.data.id}/cancel`).expect(200);

    const after = await api.get("/positions").expect(200);
    expect(after.body.data).toEqual([]);
  });

  it("rejects a request with no Authorization header with 401", async () => {
    await request(app).get("/positions").expect(401);
  });

  it("rejects a request with a garbage token with 401", async () => {
    await request(app).get("/positions").set("Authorization", "Bearer not-a-real-token").expect(401);
  });
});
