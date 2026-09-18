import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePositions } from "./use-positions";
import type { Position } from "../../types/position";

const { listMock, subscribeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("../../api/positions-api", () => ({
  positionsApi: { list: listMock },
}));

vi.mock("../../api/trades-socket", () => ({
  subscribeToTradeEvents: subscribeMock,
}));

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    symbol: "AAPL",
    netQuantity: 10,
    avgOpenPrice: 100,
    lastPrice: 110,
    realizedPnl: 0,
    unrealizedPnl: 100,
    totalPnl: 100,
    ...overrides,
  };
}

describe("usePositions", () => {
  beforeEach(() => {
    listMock.mockReset();
    subscribeMock.mockReset();
    subscribeMock.mockReturnValue(() => {});
  });

  it("loads positions on mount", async () => {
    listMock.mockResolvedValue([makePosition()]);

    const { result } = renderHook(() => usePositions());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.positions).toHaveLength(1);
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  // The socket keeps the numbers live, but a dropped socket is silent — the
  // timestamp is what lets the page say how fresh the P&L actually is.
  it("stamps each successful load and leaves it unset on failure", async () => {
    listMock.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => usePositions());

    await waitFor(() => expect(result.current.error).toBe("network down"));
    expect(result.current.lastUpdatedAt).toBeUndefined();

    listMock.mockResolvedValue([makePosition()]);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.lastUpdatedAt).toBeInstanceOf(Date);
  });

  it("surfaces a fetch error", async () => {
    listMock.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => usePositions());

    await waitFor(() => expect(result.current.error).toBe("network down"));
  });

  it("refetches whenever a trade event arrives over the socket", async () => {
    listMock.mockResolvedValue([makePosition()]);
    let handler: (event: unknown) => void = () => {};
    subscribeMock.mockImplementation((cb) => {
      handler = cb;
      return () => {};
    });

    const { result } = renderHook(() => usePositions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(listMock).toHaveBeenCalledTimes(1);

    listMock.mockResolvedValue([makePosition({ netQuantity: 20 })]);
    act(() => {
      handler({ type: "trade.created" });
    });

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.positions[0]!.netQuantity).toBe(20));
  });
});
