import { useMemo, useState } from "react";
import type { ActivityPoint } from "./trade-analytics";

interface ActivityLineChartProps {
  title: string;
  points: ActivityPoint[];
}

const WIDTH = 600;
const HEIGHT = 180;
const PADDING_LEFT = 34;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 22;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ActivityLineChart({ title, points }: ActivityLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const maxValue = niceMax(Math.max(0, ...points.map((p) => p.value)));

    const xFor = (index: number) =>
      points.length <= 1 ? PADDING_LEFT : PADDING_LEFT + (index / (points.length - 1)) * plotWidth;
    const yFor = (value: number) => PADDING_TOP + plotHeight - (value / maxValue) * plotHeight;

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`).join(" ");
    const areaPath =
      points.length > 0 ? `${linePath} L ${xFor(points.length - 1)} ${yFor(0)} L ${xFor(0)} ${yFor(0)} Z` : "";

    return { xFor, yFor, linePath, areaPath, yTicks: [0, maxValue / 2, maxValue] };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <p className="chart-empty">No data yet.</p>
      </div>
    );
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(chart.xFor(i) - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="activity-chart-wrap">
        <svg
          className="activity-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={title}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {chart.yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
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
                {Math.round(tick).toLocaleString()}
              </text>
            </g>
          ))}

          <path d={chart.areaPath} className="activity-area" />
          <path d={chart.linePath} className="activity-line" />

          <text x={chart.xFor(0)} y={HEIGHT - 4} className="chart-axis-label" textAnchor="start">
            {points[0]!.label}
          </text>
          {points.length > 1 && (
            <text x={chart.xFor(points.length - 1)} y={HEIGHT - 4} className="chart-axis-label" textAnchor="end">
              {points[points.length - 1]!.label}
            </text>
          )}

          {hoverIndex !== null && (
            <>
              <line
                x1={chart.xFor(hoverIndex)}
                x2={chart.xFor(hoverIndex)}
                y1={PADDING_TOP}
                y2={HEIGHT - PADDING_BOTTOM}
                className="activity-crosshair"
              />
              <circle
                cx={chart.xFor(hoverIndex)}
                cy={chart.yFor(points[hoverIndex]!.value)}
                r="4"
                className="activity-dot"
              />
            </>
          )}
        </svg>

        {hovered && hoverIndex !== null && (
          <div className="chart-tooltip" style={{ left: `${(chart.xFor(hoverIndex) / WIDTH) * 100}%` }}>
            <strong>{hovered.value.toLocaleString()}</strong>
            <span>{hovered.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
