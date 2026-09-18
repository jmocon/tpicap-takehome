import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { SymbolPage } from "./SymbolPage";
import { makeTrade } from "../features/trade-blotter/trade-fixtures";

const { useTradesMock } = vi.hoisted(() => ({ useTradesMock: vi.fn() }));

// The page's only data seam — mocking it keeps the API/socket clients out of
// what is a routing test.
vi.mock("../features/trade-blotter/use-trades", () => ({
  useTrades: useTradesMock,
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="pathname">{location.pathname}</span>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/symbols/:symbol?" element={<SymbolPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("SymbolPage", () => {
  beforeEach(() => {
    useTradesMock.mockReset();
    useTradesMock.mockReturnValue({
      trades: [makeTrade({ id: "TRD-1", symbol: "AAPL" }), makeTrade({ id: "TRD-2", symbol: "MSFT" })],
      loading: false,
      error: undefined,
      refresh: vi.fn(),
    });
  });

  it("navigates to the selected symbol", () => {
    renderAt("/symbols");

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "MSFT" } });

    expect(screen.getByTestId("pathname")).toHaveTextContent("/symbols/MSFT");
  });

  // Regression: the placeholder option used to be `disabled`, which made the
  // picker a one-way door out of the multi-symbol overview.
  it("offers an enabled 'All symbols' option back to the overview", () => {
    renderAt("/symbols/AAPL");

    const allSymbols = screen.getByRole("option", { name: "All symbols" });
    expect(allSymbols).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "" } });

    expect(screen.getByTestId("pathname")).toHaveTextContent("/symbols");
    expect(screen.getByText(/top \d+ symbols by volume/i)).toBeInTheDocument();
  });
});
