import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TradeBlotterPage } from "./TradeBlotterPage";
import { makeTrade } from "../features/trade-blotter/trade-fixtures";
import type { Trade } from "../types/trade";

const { listMock, cancelMock, subscribeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  cancelMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("../api/trades-api", () => ({
  tradesApi: { list: listMock, cancel: cancelMock },
}));

vi.mock("../api/trades-socket", () => ({
  subscribeToTradeEvents: subscribeMock,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <TradeBlotterPage />
    </MemoryRouter>,
  );
}

/** A promise whose settlement the test controls, to hold a request in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("TradeBlotterPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    cancelMock.mockReset();
    subscribeMock.mockReset();
    subscribeMock.mockReturnValue(() => {});
    listMock.mockResolvedValue([makeTrade({ id: "TRD-1042" })]);
  });

  it("latches the row's Cancel button while the request is in flight", async () => {
    const pending = deferred<Trade>();
    cancelMock.mockReturnValue(pending.promise);

    renderPage();
    await screen.findByRole("button", { name: /^cancel$/i });

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    // Before the response lands, the destructive action is unclickable.
    const cancelling = await screen.findByRole("button", { name: /cancelling/i });
    expect(cancelling).toBeDisabled();
    fireEvent.click(cancelling);
    expect(cancelMock).toHaveBeenCalledTimes(1);

    pending.resolve(makeTrade({ id: "TRD-1042", status: "CANCELLED" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /cancelling/i })).not.toBeInTheDocument());
  });

  it("announces a successful cancel in a polite live region", async () => {
    cancelMock.mockResolvedValue(makeTrade({ id: "TRD-1042", status: "CANCELLED" }));

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /^cancel$/i }));

    const status = await screen.findByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("Trade TRD-1042 cancelled"));
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("names the trade in a cancel failure, since the message renders away from the row", async () => {
    cancelMock.mockRejectedValue(new Error("network down"));

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /^cancel$/i }));

    expect(await screen.findByText("Failed to cancel TRD-1042: network down")).toBeInTheDocument();
    // The row becomes clickable again so the user can retry.
    await waitFor(() => expect(screen.getByRole("button", { name: /^cancel$/i })).toBeEnabled());
  });
});
