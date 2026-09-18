import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TradeTable } from "./TradeTable";
import { makeTrade } from "./trade-fixtures";

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

  it("invokes onCancel with the row's trade when Cancel is clicked", () => {
    const onCancel = vi.fn();
    const trade = makeTrade();
    render(<TradeTable trades={[trade]} onSortChange={vi.fn()} onAmend={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onCancel).toHaveBeenCalledWith(trade);
  });
});
