import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTrades } from "./use-trades";
import { makeTrade } from "./trade-fixtures";
import type { TradeQuery } from "../../api/trades-api";
import type { Trade } from "../../types/trade";

const { listMock, subscribeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("../../api/trades-api", () => ({
  tradesApi: { list: listMock },
}));

vi.mock("../../api/trades-socket", () => ({
  subscribeToTradeEvents: subscribeMock,
}));

/**
 * Renders the hook with a live socket captured, then waits for the initial
 * fetch to settle. `emit` pushes an event through the captured subscriber the
 * same way `trades-socket.ts` would.
 */
async function renderWithSocket(query: TradeQuery) {
  let handler: (event: { type: string; trade: Trade }) => void = () => {};
  subscribeMock.mockImplementation((cb) => {
    handler = cb;
    return () => {};
  });

  const { result } = renderHook(() => useTrades(query));
  await waitFor(() => expect(result.current.loading).toBe(false));

  return {
    result,
    emit: (event: { type: string; trade: Trade }) => act(() => handler(event)),
  };
}

describe("useTrades", () => {
  beforeEach(() => {
    listMock.mockReset();
    subscribeMock.mockReset();
    subscribeMock.mockReturnValue(() => {});
  });

  it("loads trades on mount", async () => {
    listMock.mockResolvedValue([makeTrade()]);

    const { result } = renderHook(() => useTrades({}));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trades).toHaveLength(1);
    expect(listMock).toHaveBeenCalledWith({});
  });

  it("surfaces a fetch error", async () => {
    listMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useTrades({}));

    await waitFor(() => expect(result.current.error).toBe("network down"));
  });

  it("merges a live update from the socket into the list", async () => {
    listMock.mockResolvedValue([makeTrade({ quantity: 10 })]);
    const { result, emit } = await renderWithSocket({});

    emit({ type: "trade.amended", trade: makeTrade({ quantity: 999 }) });

    expect(result.current.trades[0]!.quantity).toBe(999);
  });

  // The socket broadcasts every trade to every client, including ones the
  // current view has filtered out — see trade-merge.ts.
  it("ignores a live trade that does not match the active filter", async () => {
    listMock.mockResolvedValue([makeTrade({ id: "TRD-1", symbol: "AAPL" })]);
    const { result, emit } = await renderWithSocket({ symbol: "AAPL" });

    emit({ type: "trade.created", trade: makeTrade({ id: "TRD-2", symbol: "MSFT" }) });

    expect(result.current.trades.map((t) => t.id)).toEqual(["TRD-1"]);
  });

  it("drops a visible trade that no longer matches the active filter", async () => {
    listMock.mockResolvedValue([makeTrade({ id: "TRD-1", status: "ACTIVE" })]);
    const { result, emit } = await renderWithSocket({ status: "ACTIVE" });

    emit({ type: "trade.cancelled", trade: makeTrade({ id: "TRD-1", status: "CANCELLED" }) });

    expect(result.current.trades).toEqual([]);
  });

  it("places a live trade at its sorted position rather than at the top", async () => {
    listMock.mockResolvedValue([makeTrade({ id: "TRD-1", price: 10 }), makeTrade({ id: "TRD-3", price: 30 })]);
    const { result, emit } = await renderWithSocket({ sortBy: "price", sortDir: "asc" });

    emit({ type: "trade.created", trade: makeTrade({ id: "TRD-2", price: 20 }) });

    expect(result.current.trades.map((t) => t.id)).toEqual(["TRD-1", "TRD-2", "TRD-3"]);
  });
});
