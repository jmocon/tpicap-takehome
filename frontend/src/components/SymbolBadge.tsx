/**
 * A ticker rendered as a coloured initial-avatar plus its symbol text.
 *
 * The colour is derived from the symbol itself (a cheap string hash into a
 * fixed hue set) rather than stored anywhere: every view that shows AAPL gets
 * the same badge, new tickers arriving over the WebSocket get one for free, and
 * there's no per-symbol asset or mapping table to maintain. The avatar is
 * `aria-hidden` — it's a visual anchor for scanning, and the symbol text next
 * to it already carries the meaning.
 */

// Hues chosen to stay distinguishable against the dark surface and to avoid the
// buy-green / sell-red band, which means something specific elsewhere in the UI.
const HUES = [212, 258, 190, 280, 32, 172, 240, 310];

function hueFor(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) % 100000;
  }
  return HUES[hash % HUES.length]!;
}

interface SymbolBadgeProps {
  symbol: string;
}

export function SymbolBadge({ symbol }: SymbolBadgeProps) {
  const hue = hueFor(symbol);

  return (
    <span className="symbol-badge">
      <span
        className="symbol-avatar"
        aria-hidden="true"
        style={{
          background: `hsl(${hue} 70% 22%)`,
          color: `hsl(${hue} 85% 72%)`,
        }}
      >
        {symbol.charAt(0)}
      </span>
      <span className="symbol-badge-label">{symbol}</span>
    </span>
  );
}
