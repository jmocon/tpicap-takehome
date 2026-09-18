import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTrades } from "../features/trade-blotter/use-trades";
import { getDistinctSymbols } from "../features/symbol-detail/symbol-detail";
import { SymbolAnalytics } from "../features/symbol-detail/SymbolAnalytics";
import { OHLCOverview } from "../features/symbol-detail/OHLCOverview";

export function SymbolPage() {
  const { symbol: symbolParam } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();
  // Unfiltered — same hook the blotter page uses, so this page also gets
  // live WebSocket updates the same way. Filtering to one symbol happens
  // client-side below.
  const { trades, loading, error } = useTrades({});

  const symbols = useMemo(() => getDistinctSymbols(trades), [trades]);
  // No symbol in the URL means no selection at all — don't silently default
  // to "first alphabetically" (arbitrary); show the multi-symbol OHLC
  // overview instead (see OHLCOverview) until the user actually picks one.
  const selectedSymbol = symbolParam && symbols.includes(symbolParam) ? symbolParam : undefined;

  const symbolTrades = useMemo(
    () => (selectedSymbol ? trades.filter((t) => t.symbol === selectedSymbol) : []),
    [trades, selectedSymbol],
  );

  // The empty option is a real destination, not a placeholder: without it the
  // picker is a one-way door — once a symbol is chosen there's no way back to
  // the top-5 OHLC overview short of editing the URL.
  function handleSelect(next: string) {
    navigate(next ? `/symbols/${encodeURIComponent(next)}` : "/symbols");
  }

  return (
    <main className="symbol-page">
      <header>
        <div className="header-meta">
          <h1>By Symbol</h1>
        </div>
        {symbols.length > 0 && (
          <select aria-label="Symbol" value={selectedSymbol ?? ""} onChange={(e) => handleSelect(e.target.value)}>
            <option value="">All symbols</option>
            {symbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        )}
      </header>

      {error && <p className="field-error">{error}</p>}

      {loading && trades.length === 0 && <p className="empty-state">Loading trades…</p>}
      {!loading && symbols.length === 0 && <p className="empty-state">No trades yet.</p>}

      {selectedSymbol ? (
        <SymbolAnalytics symbol={selectedSymbol} trades={symbolTrades} />
      ) : (
        symbols.length > 0 && <OHLCOverview trades={trades} />
      )}
    </main>
  );
}
