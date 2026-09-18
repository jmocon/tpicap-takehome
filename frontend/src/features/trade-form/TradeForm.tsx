import { useState } from "react";
import type { Trade } from "../../types/trade";
import { validateTradeForm, type TradeFormValues } from "./trade-form-validation";

export interface TradeFormSubmitValues {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  trader: string;
  book?: string;
  counterparty?: string;
}

interface TradeFormProps {
  /** Present for amend, absent for create — the single thing that changes behavior. */
  initialTrade?: Trade;
  onSubmit: (values: TradeFormSubmitValues) => Promise<void>;
  onCancel: () => void;
}

interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  className?: string;
}

function FormField({ label, value, error, onChange, className }: FormFieldProps) {
  return (
    <label className={className ? `form-field ${className}` : "form-field"}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function toFormValues(trade?: Trade): TradeFormValues {
  return {
    symbol: trade?.symbol ?? "",
    side: trade?.side ?? "BUY",
    quantity: trade ? String(trade.quantity) : "",
    price: trade ? String(trade.price) : "",
    trader: trade?.trader ?? "",
    book: trade?.book ?? "",
    counterparty: trade?.counterparty ?? "",
  };
}

export function TradeForm({ initialTrade, onSubmit, onCancel }: TradeFormProps) {
  const [values, setValues] = useState<TradeFormValues>(() => toFormValues(initialTrade));
  const [errors, setErrors] = useState<ReturnType<typeof validateTradeForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const isAmend = Boolean(initialTrade);

  function updateField<K extends keyof TradeFormValues>(field: K, value: TradeFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateTradeForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmit({
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        quantity: Number(values.quantity),
        price: Number(values.price),
        trader: values.trader.trim(),
        book: values.book.trim() || undefined,
        counterparty: values.counterparty.trim() || undefined,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save trade");
    } finally {
      setSubmitting(false);
    }
  }

  const hasAdditionalDetails = Boolean(initialTrade?.book || initialTrade?.counterparty);

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      <h2>{isAmend ? `Amend ${initialTrade!.id}` : "Create Trade"}</h2>

      <div className="form-row">
        <FormField
          className="form-field-symbol"
          label="Symbol"
          value={values.symbol}
          error={errors.symbol}
          onChange={(v) => updateField("symbol", v)}
        />
        <label className="form-field form-field-side">
          Side
          <select value={values.side} onChange={(e) => updateField("side", e.target.value as "BUY" | "SELL")}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <FormField
          className="form-field-qty"
          label="Quantity"
          value={values.quantity}
          error={errors.quantity}
          onChange={(v) => updateField("quantity", v)}
        />
        <FormField
          className="form-field-price"
          label="Price"
          value={values.price}
          error={errors.price}
          onChange={(v) => updateField("price", v)}
        />
      </div>

      <FormField label="Trader" value={values.trader} error={errors.trader} onChange={(v) => updateField("trader", v)} />

      <details className="form-section" open={hasAdditionalDetails}>
        <summary>Additional details (optional)</summary>
        <div className="form-row">
          <FormField label="Book" value={values.book} onChange={(v) => updateField("book", v)} />
          <FormField
            label="Counterparty"
            value={values.counterparty}
            onChange={(v) => updateField("counterparty", v)}
          />
        </div>
      </details>

      {submitError && <p className="field-error">{submitError}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : isAmend ? "Save Changes" : "Create Trade"}
        </button>
      </div>
    </form>
  );
}
