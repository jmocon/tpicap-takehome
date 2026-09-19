import type { ReactNode } from "react";

interface ChartCardHeaderProps {
  title: string;
  /** Optional glyph shown in a tinted badge ahead of the title. */
  icon?: ReactNode;
}

/**
 * The title row shared by every `.chart-card`.
 *
 * Kept as its own component so the three chart types (ranked bars, activity
 * line, OHLC) can't drift apart on badge size, heading level or spacing — each
 * of them renders this and then only its own plot area.
 */
export function ChartCardHeader({ title, icon }: ChartCardHeaderProps) {
  return (
    <div className="chart-card-header">
      {icon && (
        <span className="chart-card-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="chart-title">{title}</h3>
    </div>
  );
}
