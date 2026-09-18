import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTrades } from "./use-trades";
import { makeTrade } from "./trade-fixtures";
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
    let handler: (event: { type: string; trade: Trade }) => void = () => {};
    subscribeMock.mockImplementation((cb) => {
      handler = cb;
      return () => {};
    });

    const { result } = renderHook(() => useTrades({}));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      handler({ type: "trade.amended", trade: makeTrade({ quantity: 999 }) });
    });

    expect(result.current.trades[0].quantity).toBe(999);
  });
});
