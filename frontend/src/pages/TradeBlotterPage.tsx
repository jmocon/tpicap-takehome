import { useState } from "react";
import { tradesApi, type TradeQuery } from "../api/trades-api";
import type { Trade } from "../types/trade";
import { useTrades } from "../features/trade-blotter/use-trades";
import { TradeTable } from "../features/trade-blotter/TradeTable";
import { TradeFilters } from "../features/trade-blotter/TradeFilters";
import { TradeForm, type TradeFormSubmitValues } from "../features/trade-form/TradeForm";
import { Modal } from "../components/Modal";

type FormTarget = { mode: "create" } | { mode: "amend"; trade: Trade } | undefined;

export function TradeBlotterPage() {
  const [query, setQuery] = useState<TradeQuery>({ sortBy: "tradeDate", sortDir: "desc" });
  const { trades, loading, error, refresh } = useTrades(query);
  const [formTarget, setFormTarget] = useState<FormTarget>(undefined);
  const [actionError, setActionError] = useState<string>();

  function handleSortChange(field: NonNullable<TradeQuery["sortBy"]>) {
    setQuery((current) => ({
      ...current,
      sortBy: field,
      sortDir: current.sortBy === field && current.sortDir === "asc" ? "desc" : "asc",
    }));
  }

  async function handleCancel(trade: Trade) {
    setActionError(undefined);
    try {
      await tradesApi.cancel(trade.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel trade");
    }
  }

  async function handleFormSubmit(values: TradeFormSubmitValues) {
    if (formTarget?.mode === "amend") {
      await tradesApi.amend(formTarget.trade.id, values);
    } else {
      await tradesApi.create(values);
    }
    setFormTarget(undefined);
  }

  return (
    <main className="trade-blotter-page">
      <header>
        <h1>Trade Blotter</h1>
        <button type="button" onClick={() => setFormTarget({ mode: "create" })}>
          New Trade
        </button>
      </header>

      <TradeFilters filters={query} onChange={setQuery} onRefresh={refresh} refreshing={loading} />

      {error && <p className="field-error">{error}</p>}
      {actionError && <p className="field-error">{actionError}</p>}

      <TradeTable
        trades={trades}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        onSortChange={handleSortChange}
        onAmend={(trade) => setFormTarget({ mode: "amend", trade })}
        onCancel={handleCancel}
      />

      {formTarget && (
        <Modal onClose={() => setFormTarget(undefined)}>
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
