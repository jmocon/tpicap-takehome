import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "./trades.repository.js";
import { TradesService } from "./trades.service.js";
import { TradesController } from "./trades.controller.js";
import { noopBroadcaster } from "../realtime/broadcaster.js";
import { AuditRepository } from "../audit/audit.repository.js";
import { PositionsRepository } from "../positions/positions.repository.js";
import { PositionsService } from "../positions/positions.service.js";
import { PositionsController } from "../positions/positions.controller.js";
import { UsersRepository } from "../auth/users.repository.js";
import { AuthService } from "../auth/auth.service.js";
import { AuthController } from "../auth/auth.controller.js";
import { signTestToken, TEST_JWT_SECRET } from "../test-support/auth-test-support.js";

function buildApp() {
  const db = createTestDb();
  const repository = new TradesRepository(db);
  const auditRepository = new AuditRepository(db);
  const service = new TradesService(repository, noopBroadcaster, auditRepository);
  const controller = new TradesController(service, auditRepository);
  const positionsController = new PositionsController(new PositionsService(new PositionsRepository(db)));
  const authController = new AuthController(new AuthService(new UsersRepository(db), TEST_JWT_SECRET));
  return createApp({
    tradesController: controller,
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
    patch: (path: string) => request(app).patch(path).set("Authorization", `Bearer ${token}`),
  };
}

describe("trades routes", () => {
  let app: ReturnType<typeof buildApp>;
  let api: ReturnType<typeof authed>;

  beforeEach(() => {
    app = buildApp();
    api = authed(app);
  });

  it("creates then lists a trade", async () => {
    await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" })
      .expect(201);

    const res = await api.get("/trades").expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].symbol).toBe("AAPL");
  });

  it("rejects an invalid create payload with 400", async () => {
    const res = await api
      .post("/trades")
      .send({ symbol: "", side: "BUY", quantity: -5, price: 100, trader: "" })
      .expect(400);

    expect(res.body.error.message).toMatch(/invalid/i);
  });

  it("amends a trade", async () => {
    const created = await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });

    const res = await api.patch(`/trades/${created.body.data.id}`).send({ quantity: 999 }).expect(200);

    expect(res.body.data.quantity).toBe(999);
  });

  it("cancels a trade and rejects amending it afterward", async () => {
    const created = await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });
    const id = created.body.data.id;

    await api.post(`/trades/${id}/cancel`).expect(200);

    const res = await api.patch(`/trades/${id}`).send({ quantity: 1 }).expect(409);
    expect(res.body.error.message).toMatch(/cancelled/i);
  });

  it("returns 404 for a missing trade", async () => {
    await api.get("/trades/does-not-exist").expect(404);
  });

  it("returns the audit history after amending a trade", async () => {
    const created = await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });
    const id = created.body.data.id;

    await api.patch(`/trades/${id}`).send({ quantity: 999 }).expect(200);

    const res = await api.get(`/trades/${id}/audit`).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      tradeId: id,
      action: "AMEND",
      changes: { quantity: { old: 10, new: 999 } },
    });
  });

  it("returns the audit history after cancelling a trade", async () => {
    const created = await api
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });
    const id = created.body.data.id;

    await api.post(`/trades/${id}/cancel`).expect(200);

    const res = await api.get(`/trades/${id}/audit`).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      tradeId: id,
      action: "CANCEL",
      changes: { status: { old: "ACTIVE", new: "CANCELLED" } },
    });
  });

  it("returns 404 for the audit history of a missing trade", async () => {
    await api.get("/trades/does-not-exist/audit").expect(404);
  });

  it("rejects a request with no Authorization header with 401", async () => {
    await request(app).get("/trades").expect(401);
  });

  it("rejects a request with a garbage token with 401", async () => {
    await request(app).get("/trades").set("Authorization", "Bearer not-a-real-token").expect(401);
  });
});
