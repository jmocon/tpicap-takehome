import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TradeTable } from "./TradeTable";
import { makeTrade } from "./trade-fixtures";

const { getAuditMock } = vi.hoisted(() => ({
  getAuditMock: vi.fn(),
}));

vi.mock("../../api/trades-api", () => ({
  tradesApi: { getAudit: getAuditMock },
}));

describe("TradeTable", () => {
  it("shows an empty state when there are no trades", () => {
    render(<TradeTable trades={[]} onSortChange={vi.fn()} onAmend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/no trades match/i)).toBeInTheDocument();
  });

  it("renders a row per trade", () => {
    render(
      <TradeTable
        trades={[makeTrade(), makeTrade({ id: "TRD-2", symbol: "MSFT" })]}
        onSortChange={vi.fn()}
        onAmend={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
  });

  it("calls onSortChange with the clicked column's field", () => {
    const onSortChange = vi.fn();
    render(<TradeTable trades={[makeTrade()]} onSortChange={onSortChange} onAmend={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /symbol/i }));
    expect(onSortChange).toHaveBeenCalledWith("symbol");
  });

  it("disables amend/cancel actions for a cancelled trade", () => {
    render(
      <TradeTable
        trades={[makeTrade({ status: "CANCELLED" })]}
        onSortChange={vi.fn()}
        onAmend={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /amend/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDisabled();
  });

  it("shows an in-flight Cancel as disabled so it can't be fired twice", () => {
    const trade = makeTrade({ id: "TRD-1" });
    render(
      <TradeTable
        trades={[trade, makeTrade({ id: "TRD-2", symbol: "MSFT" })]}
        onSortChange={vi.fn()}
        onAmend={vi.fn()}
        onCancel={vi.fn()}
        cancellingId="TRD-1"
      />,
    );

    expect(screen.getByRole("button", { name: /cancelling/i })).toBeDisabled();
    // Only the row whose request is in flight latches — the other row's
    // Cancel stays live.
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeEnabled();
  });

  it("invokes onCancel with the row's trade when Cancel is clicked", () => {
    const onCancel = vi.fn();
    const trade = makeTrade();
    render(<TradeTable trades={[trade]} onSortChange={vi.fn()} onAmend={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledWith(trade);
  });

  it("opens the trade history modal fetched for the clicked row", async () => {
    getAuditMock.mockResolvedValue([
      { id: 1, tradeId: "TRD-1", action: "AMEND", changes: { quantity: { old: 10, new: 20 } }, changedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const trade = makeTrade();
    render(<TradeTable trades={[trade]} onSortChange={vi.fn()} onAmend={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /history/i }));

    expect(getAuditMock).toHaveBeenCalledWith("TRD-1");
    await waitFor(() => expect(screen.getByText("AMEND")).toBeInTheDocument());
  });
});
