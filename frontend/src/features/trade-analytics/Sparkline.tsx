import { useMemo } from "react";
import type { ActivityPoint } from "./trade-analytics";

interface SparklineProps {
  points: ActivityPoint[];
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 60;
const DEFAULT_HEIGHT = 24;
const PADDING = 2;

// A dense, non-interactive trend indicator for a table cell — no axes,
// gridlines, or hover/tooltip. See ActivityLineChart for the full standalone
// chart-card version; this is deliberately a much lighter sibling.
export function Sparkline({ points, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT }: SparklineProps) {
  const chart = useMemo(() => {
    if (points.length < 2) return null;

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const plotWidth = width - PADDING * 2;
    const plotHeight = height - PADDING * 2;

    const xFor = (index: number) => PADDING + (index / (points.length - 1)) * plotWidth;
    const yFor = (value: number) =>
      range === 0 ? PADDING + plotHeight / 2 : PADDING + plotHeight - ((value - min) / range) * plotHeight;

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`).join(" ");
    const areaPath = `${linePath} L ${xFor(points.length - 1)} ${height - PADDING} L ${xFor(0)} ${height - PADDING} Z`;

    return { linePath, areaPath };
  }, [points, width, height]);

  if (!chart) {
    // 0 or 1 data points — nothing to draw a trend from. A flat marker beats
    // a warped/empty chart or a crash.
    return (
      <svg
        className="sparkline sparkline-empty"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="No trend data"
      >
        <circle cx={width / 2} cy={height / 2} r={2} className="sparkline-dot" />
      </svg>
    );
  }

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price trend">
      <path d={chart.areaPath} className="sparkline-area" />
      <path d={chart.linePath} className="sparkline-line" />
    </svg>
  );
}
