import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PositionsTable } from "./PositionsTable";
import type { Position } from "../../types/position";

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    symbol: "AAPL",
    netQuantity: 10,
    avgOpenPrice: 100,
    lastPrice: 110,
    realizedPnl: 50,
    unrealizedPnl: 100,
    totalPnl: 150,
    ...overrides,
  };
}

describe("PositionsTable", () => {
  it("shows an empty state when there are no positions", () => {
    render(<PositionsTable positions={[]} />);
    expect(screen.getByText(/no open positions/i)).toBeInTheDocument();
  });

  it("renders a row per position with formatted values", () => {
    render(<PositionsTable positions={[makePosition()]} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("100.00")).toBeInTheDocument();
    expect(screen.getByText("110.00")).toBeInTheDocument();
    expect(screen.getByText("+50.00")).toBeInTheDocument();
    expect(screen.getByText("+100.00")).toBeInTheDocument();
    expect(screen.getByText("+150.00")).toBeInTheDocument();
  });

  it("colors a negative P&L with the sell (red) class and a positive one with the buy (green) class", () => {
    render(<PositionsTable positions={[makePosition({ realizedPnl: -25, unrealizedPnl: 10, totalPnl: -15 })]} />);

    expect(screen.getByText("-25.00")).toHaveClass("pnl-negative");
    expect(screen.getByText("+10.00")).toHaveClass("pnl-positive");
    expect(screen.getByText("-15.00")).toHaveClass("pnl-negative");
  });

  it("renders one row per distinct symbol", () => {
    render(<PositionsTable positions={[makePosition(), makePosition({ symbol: "MSFT" })]} />);

    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 data rows
  });
});
