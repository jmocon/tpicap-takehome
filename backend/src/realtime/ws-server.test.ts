import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createWsServer, WS_PATH } from "./ws-server.js";
import type { Broadcaster } from "./broadcaster.js";

describe("createWsServer", () => {
  let httpServer: ReturnType<typeof createServer>;
  let broadcaster: Broadcaster;
  let port: number;

  beforeEach(async () => {
    httpServer = createServer();
    broadcaster = createWsServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as AddressInfo).port;
  });

  afterEach(() => {
    httpServer.close();
  });

  it("delivers a published event to a connected client", async () => {
    const client = new WebSocket(`ws://localhost:${port}${WS_PATH}`);
    await new Promise((resolve) => client.once("open", resolve));

    const received = new Promise((resolve) => {
      client.once("message", (data) => resolve(JSON.parse(data.toString())));
    });

    broadcaster.publish({
      type: "trade.created",
      trade: {
        id: "TRD-1",
        symbol: "AAPL",
        side: "BUY",
        quantity: 1,
        price: 1,
        trader: "JSMITH",
        tradeDate: "2026-01-01T00:00:00.000Z",
        status: "ACTIVE",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(await received).toMatchObject({ type: "trade.created" });
    client.close();
  });

  it("rejects a connection on any path other than WS_PATH", async () => {
    const client = new WebSocket(`ws://localhost:${port}/not-ws`);
    const errored = new Promise<void>((resolve) => client.once("error", () => resolve()));
    await errored;
  });
});
