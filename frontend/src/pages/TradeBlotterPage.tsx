import { useCallback, useEffect, useRef, useState } from "react";
import { tradesApi, type TradeQuery } from "../api/trades-api";
import type { Trade } from "../types/trade";
import { useTrades } from "../features/trade-blotter/use-trades";
import { TradeTable } from "../features/trade-blotter/TradeTable";
import { TradeFilters } from "../features/trade-blotter/TradeFilters";
import { generateRandomTrade } from "../features/trade-blotter/random-trade";
import { useAutoSimulate } from "../features/trade-blotter/use-auto-simulate";
import { TradeForm, type TradeFormSubmitValues } from "../features/trade-form/TradeForm";
import { TradeAnalytics } from "../features/trade-analytics/TradeAnalytics";
import { Modal } from "../components/Modal";

type FormTarget = { mode: "create" } | { mode: "amend"; trade: Trade } | undefined;

// Presets for the "Auto Simulate" frequency control, in milliseconds.
const AUTO_SIMULATE_INTERVALS = [
  { value: 500, label: "Every 0.5s" },
  { value: 1000, label: "Every 1s" },
  { value: 2000, label: "Every 2s" },
  { value: 5000, label: "Every 5s" },
  { value: 10000, label: "Every 10s" },
] as const;

const DEFAULT_AUTO_SIMULATE_INTERVAL_MS = 2000;

/** How long a "your action landed" confirmation stays on screen. */
const STATUS_MESSAGE_MS = 4000;

export function TradeBlotterPage() {
  const [query, setQuery] = useState<TradeQuery>({ sortBy: "tradeDate", sortDir: "desc" });
  const { trades, loading, error, refresh } = useTrades(query);
  const [formTarget, setFormTarget] = useState<FormTarget>(undefined);
  const [actionError, setActionError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState("");
  const [cancellingId, setCancellingId] = useState<string>();
  const [simulating, setSimulating] = useState(false);
  const [autoSimulating, setAutoSimulating] = useState(false);
  const [autoSimulateIntervalMs, setAutoSimulateIntervalMs] = useState(DEFAULT_AUTO_SIMULATE_INTERVAL_MS);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // With live updates (and Auto Simulate) running, rows appear and change on
  // their own — a confirmation is the only way to tell "my amend landed" from
  // "another client booked something". Announced politely so it doesn't
  // interrupt, and cleared so it can't be mistaken for a fresh result later.
  const announce = useCallback((message: string) => {
    setStatusMessage(message);
    clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(""), STATUS_MESSAGE_MS);
  }, []);

  useEffect(() => () => clearTimeout(statusTimerRef.current), []);

  function handleSortChange(field: NonNullable<TradeQuery["sortBy"]>) {
    setQuery((current) => ({
      ...current,
      sortBy: field,
      sortDir: current.sortBy === field && current.sortDir === "asc" ? "desc" : "asc",
    }));
  }

  // Cancel is destructive and irreversible, so the in-flight id is tracked
  // here and handed to TradeTable, which latches that row's button. The id is
  // in both the confirmation and the failure text because the message renders
  // at the top of the page, far from the row it refers to.
  async function handleCancel(trade: Trade) {
    if (cancellingId) return;
    setActionError(undefined);
    setCancellingId(trade.id);
    try {
      await tradesApi.cancel(trade.id);
      announce(`Trade ${trade.id} cancelled`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown error";
      setActionError(`Failed to cancel ${trade.id}: ${reason}`);
    } finally {
      setCancellingId(undefined);
    }
  }

  // Demo helper: submits one randomly generated trade through the same create
  // endpoint the "New Trade" form uses, so it broadcasts over the existing
  // WebSocket and shows up live across clients without any backend changes.
  async function handleSimulateTrade() {
    setActionError(undefined);
    setSimulating(true);
    try {
      await tradesApi.create(generateRandomTrade());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to simulate trade");
    } finally {
      setSimulating(false);
    }
  }

  // Drives handleSimulateTrade on a repeating interval while the "Auto
  // Simulate" toggle is on, for an unattended live demo. The hook itself
  // guards against overlapping calls and cleans up its interval on
  // toggle-off/unmount.
  useAutoSimulate(handleSimulateTrade, autoSimulateIntervalMs, autoSimulating);

  async function handleFormSubmit(values: TradeFormSubmitValues) {
    if (formTarget?.mode === "amend") {
      await tradesApi.amend(formTarget.trade.id, values);
      announce(`Trade ${formTarget.trade.id} amended`);
    } else {
      const created = await tradesApi.create(values);
      announce(`Trade ${created.id} created`);
    }
    setFormTarget(undefined);
  }

  return (
    <main className="trade-blotter-page">
      <header>
        <div className="header-meta">
          <h1>Trade Blotter</h1>
          <span className="trade-count">{trades.length.toLocaleString()} trades</span>
        </div>
        <div className="header-actions">
          <div className="simulate-controls">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSimulateTrade}
              disabled={simulating || autoSimulating}
            >
              {simulating ? "Simulating..." : "Simulate Trade"}
            </button>
            <button
              type="button"
              className={autoSimulating ? "btn-secondary btn-toggle-on" : "btn-secondary"}
              onClick={() => setAutoSimulating((current) => !current)}
              aria-pressed={autoSimulating}
            >
              {autoSimulating ? "Stop Auto" : "Start Auto"}
            </button>
            <select
              aria-label="Auto simulate frequency"
              value={autoSimulateIntervalMs}
              onChange={(e) => setAutoSimulateIntervalMs(Number(e.target.value))}
            >
              {AUTO_SIMULATE_INTERVALS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn-primary" onClick={() => setFormTarget({ mode: "create" })}>
            New Trade
          </button>
        </div>
      </header>

      <TradeFilters filters={query} trades={trades} onChange={setQuery} onRefresh={refresh} refreshing={loading} />

      {error && <p className="field-error">{error}</p>}
      {actionError && <p className="field-error">{actionError}</p>}
      {/* Always rendered, never conditionally mounted — assistive tech only
          announces changes inside a live region that already existed. */}
      <p className="status-message" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <TradeAnalytics trades={trades} />

      <TradeTable
        trades={trades}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        onSortChange={handleSortChange}
        onAmend={(trade) => setFormTarget({ mode: "amend", trade })}
        onCancel={handleCancel}
        cancellingId={cancellingId}
      />

      {formTarget && (
        <Modal
          label={formTarget.mode === "amend" ? `Amend trade ${formTarget.trade.id}` : "Create trade"}
          onClose={() => setFormTarget(undefined)}
        >
          <TradeForm
            initialTrade={formTarget.mode === "amend" ? formTarget.trade : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormTarget(undefined)}
          />
        </Modal>
      )}
    </main>
  );
}
