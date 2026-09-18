import { useMemo, useState } from "react";
import type { OHLCBar } from "./trade-analytics";
import type { ChartVariant } from "./ActivityLineChart";

interface OHLCChartProps {
  title: string;
  bars: OHLCBar[];
  /** See ChartVariant — `wide` is the viewBox for one-chart-per-row layouts. */
  variant?: ChartVariant;
}

const VIEWBOX_WIDTH: Record<ChartVariant, number> = { default: 600, wide: 1100 };
const HEIGHT = 180;
const PADDING_LEFT = 46;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 22;

export function OHLCChart({ title, bars, variant = "default" }: OHLCChartProps) {
  // Per-bar hover, not a shared crosshair — each candle is a discrete mark
  // (four independent values), unlike ActivityLineChart's continuous series.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = VIEWBOX_WIDTH[variant];

  const chart = useMemo(() => {
    const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const rawMin = Math.min(...bars.map((b) => b.low));
    const rawMax = Math.max(...bars.map((b) => b.high));
    const span = rawMax - rawMin;
    // Pad the price domain so the highest/lowest wick isn't flush against
    // the plot edge; fall back to a small fixed pad when every bar traded at
    // the same price (span === 0, which would otherwise divide by zero).
    const pad = span === 0 ? Math.max(1, rawMax * 0.05) : span * 0.08;
    const domainMin = rawMin - pad;
    const domainMax = rawMax + pad;
    const domainSpan = domainMax - domainMin || 1;

    const barSlot = bars.length > 0 ? plotWidth / bars.length : plotWidth;
    const bodyWidth = Math.max(2, Math.min(14, barSlot * 0.6));

    const xFor = (index: number) => PADDING_LEFT + barSlot * (index + 0.5);
    const yFor = (value: number) => PADDING_TOP + plotHeight - ((value - domainMin) / domainSpan) * plotHeight;

    return { xFor, yFor, bodyWidth, yTicks: [domainMin, (domainMin + domainMax) / 2, domainMax] };
  }, [bars, width]);

  if (bars.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <p className="chart-empty">No data yet.</p>
      </div>
    );
  }

  const hovered = hoverIndex !== null ? bars[hoverIndex] : undefined;

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="activity-chart-wrap">
        <svg className="activity-chart" viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={title}>
          {chart.yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={width - PADDING_RIGHT}
                y1={chart.yFor(tick)}
                y2={chart.yFor(tick)}
                className="chart-gridline"
              />
              <text
                x={PADDING_LEFT - 8}
                y={chart.yFor(tick)}
                className="chart-axis-label"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          ))}

          {bars.map((bar, index) => {
            const isUp = bar.close >= bar.open;
            const x = chart.xFor(index);
            const bodyTop = chart.yFor(Math.max(bar.open, bar.close));
            const bodyBottom = chart.yFor(Math.min(bar.open, bar.close));
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            return (
              // Focusable so keyboard users can reach each bar's tooltip too
              // (mirrors ActivityLineChart's hover-on-every-mark convention).
              <g
                key={`${bar.label}-${index}`}
                className="ohlc-bar"
                tabIndex={0}
                aria-label={`${bar.label}: open ${bar.open.toFixed(2)}, high ${bar.high.toFixed(2)}, low ${bar.low.toFixed(2)}, close ${bar.close.toFixed(2)}`}
                onPointerEnter={() => setHoverIndex(index)}
                onPointerLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex((current) => (current === index ? null : current))}
              >
                <line
                  x1={x}
                  x2={x}
                  y1={chart.yFor(bar.high)}
                  y2={chart.yFor(bar.low)}
                  className={isUp ? "ohlc-wick-up" : "ohlc-wick-down"}
                />
                <rect
                  x={x - chart.bodyWidth / 2}
                  y={bodyTop}
                  width={chart.bodyWidth}
                  height={bodyHeight}
                  className={isUp ? "ohlc-body-up" : "ohlc-body-down"}
                />
              </g>
            );
          })}

          <text x={chart.xFor(0)} y={HEIGHT - 4} className="chart-axis-label" textAnchor="start">
            {bars[0]!.label}
          </text>
          {bars.length > 1 && (
            <text x={chart.xFor(bars.length - 1)} y={HEIGHT - 4} className="chart-axis-label" textAnchor="end">
              {bars[bars.length - 1]!.label}
            </text>
          )}
        </svg>

        {hovered && hoverIndex !== null && (
          <div className="chart-tooltip" style={{ left: `${(chart.xFor(hoverIndex) / width) * 100}%` }}>
            <strong>{hovered.label}</strong>
            <span>
              O {hovered.open.toFixed(2)} · H {hovered.high.toFixed(2)}
            </span>
            <span>
              L {hovered.low.toFixed(2)} · C {hovered.close.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
