import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { createTestDb } from "../test-support/test-db.js";
import { TradesRepository } from "./trades.repository.js";
import { TradesService } from "./trades.service.js";
import { TradesController } from "./trades.controller.js";
import { noopBroadcaster } from "../realtime/broadcaster.js";

function buildApp() {
  const db = createTestDb();
  const repository = new TradesRepository(db);
  const service = new TradesService(repository, noopBroadcaster);
  const controller = new TradesController(service);
  return createApp({ tradesController: controller, corsOrigin: "*" });
}

describe("trades routes", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  it("creates then lists a trade", async () => {
    await request(app)
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" })
      .expect(201);

    const res = await request(app).get("/trades").expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].symbol).toBe("AAPL");
  });

  it("rejects an invalid create payload with 400", async () => {
    const res = await request(app)
      .post("/trades")
      .send({ symbol: "", side: "BUY", quantity: -5, price: 100, trader: "" })
      .expect(400);

    expect(res.body.error.message).toMatch(/invalid/i);
  });

  it("amends a trade", async () => {
    const created = await request(app)
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });

    const res = await request(app)
      .patch(`/trades/${created.body.data.id}`)
      .send({ quantity: 999 })
      .expect(200);

    expect(res.body.data.quantity).toBe(999);
  });

  it("cancels a trade and rejects amending it afterward", async () => {
    const created = await request(app)
      .post("/trades")
      .send({ symbol: "AAPL", side: "BUY", quantity: 10, price: 100, trader: "JSMITH" });
    const id = created.body.data.id;

    await request(app).post(`/trades/${id}/cancel`).expect(200);

    const res = await request(app).patch(`/trades/${id}`).send({ quantity: 1 }).expect(409);
    expect(res.body.error.message).toMatch(/cancelled/i);
  });

  it("returns 404 for a missing trade", async () => {
    await request(app).get("/trades/does-not-exist").expect(404);
  });
});
