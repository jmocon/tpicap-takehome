import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { TradeHistoryModal } from "./TradeHistoryModal";
import type { AuditLogEntry } from "../../types/trade";

const { getAuditMock } = vi.hoisted(() => ({
  getAuditMock: vi.fn(),
}));

vi.mock("../../api/trades-api", () => ({
  tradesApi: { getAudit: getAuditMock },
}));

function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 1,
    tradeId: "TRD-1",
    action: "AMEND",
    changes: { quantity: { old: 10, new: 20 } },
    changedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("TradeHistoryModal", () => {
  beforeEach(() => {
    getAuditMock.mockReset();
  });

  it("fetches and renders audit entries with their changed fields", async () => {
    getAuditMock.mockResolvedValue([makeEntry()]);

    render(<TradeHistoryModal tradeId="TRD-1" onClose={vi.fn()} />);

    expect(getAuditMock).toHaveBeenCalledWith("TRD-1");
    await waitFor(() => expect(screen.getByText("AMEND")).toBeInTheDocument());
    expect(screen.getByText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByText(/10.*20/)).toBeInTheDocument();
  });

  it("shows an empty state when a trade has no history", async () => {
    getAuditMock.mockResolvedValue([]);

    render(<TradeHistoryModal tradeId="TRD-1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/no amendments or cancellations/i)).toBeInTheDocument());
  });

  it("shows an error message when the fetch fails", async () => {
    getAuditMock.mockRejectedValue(new Error("network down"));

    render(<TradeHistoryModal tradeId="TRD-1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("network down")).toBeInTheDocument());
  });

  it("retries the fetch without reopening the modal", async () => {
    getAuditMock.mockRejectedValueOnce(new Error("network down"));

    render(<TradeHistoryModal tradeId="TRD-1" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("network down")).toBeInTheDocument());

    getAuditMock.mockResolvedValueOnce([makeEntry()]);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => expect(screen.getByText("AMEND")).toBeInTheDocument());
    expect(screen.queryByText("network down")).not.toBeInTheDocument();
    expect(getAuditMock).toHaveBeenCalledTimes(2);
  });

  it("offers no Retry while the fetch is succeeding", async () => {
    getAuditMock.mockResolvedValue([]);

    render(<TradeHistoryModal tradeId="TRD-1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/no amendments/i)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", async () => {
    getAuditMock.mockResolvedValue([]);
    const onClose = vi.fn();

    render(<TradeHistoryModal tradeId="TRD-1" onClose={onClose} />);

    await waitFor(() => expect(screen.getByText(/no amendments/i)).toBeInTheDocument());
    screen.getByRole("button", { name: /close/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
