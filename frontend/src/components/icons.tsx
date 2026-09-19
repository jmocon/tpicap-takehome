/**
 * Inline SVG icon set.
 *
 * Deliberately hand-rolled rather than pulled from an icon package: the app
 * needs ~15 glyphs, and a dependency would ship thousands. Every icon is a
 * 24-unit stroke drawing that inherits `currentColor` and sizes from the `size`
 * prop, so an icon always matches the colour and weight of the text beside it.
 *
 * All icons are `aria-hidden` — they sit next to a visible text label, so
 * exposing them to assistive tech would only duplicate that label (and would
 * break the accessible names our tests match on).
 */

interface IconProps {
  /** Rendered edge length in px. Defaults to 16 — the size next to body text. */
  size?: number;
  className?: string;
}

function Icon({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** App mark — three ascending bars, echoing the blotter's own charts. */
export function LogoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 20V12" strokeWidth={2.6} />
      <path d="M12 20V4" strokeWidth={2.6} />
      <path d="M19 20v-6" strokeWidth={2.6} />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4" />
      <path d="M6 12h10" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5l11 7-11 7z" fill="currentColor" strokeWidth={1.2} />
    </Icon>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" strokeWidth={1.2} />
    </Icon>
  );
}

/** Flask — "Simulate Trade" books a synthetic trade, an experiment, not a real ticket. */
export function FlaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 3v6.2L4.8 17a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3l-4.7-7.8V3" />
      <path d="M8 3h8" />
      <path d="M7.2 14h9.6" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.8" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M15 6l3 3" />
    </Icon>
  );
}

export function CancelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.2 9.2l5.6 5.6" />
      <path d="M14.8 9.2l-5.6 5.6" />
    </Icon>
  );
}

/** Clock with a counter-clockwise arrow — the audit trail for one trade. */
export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4.2l3 1.8" />
    </Icon>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 20v-7" strokeWidth={2.2} />
      <path d="M12 20V7" strokeWidth={2.2} />
      <path d="M18 20v-4" strokeWidth={2.2} />
    </Icon>
  );
}

export function PieChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4a8 8 0 1 0 8 8h-8z" />
      <path d="M14.5 3.4A8 8 0 0 1 20.6 9.5h-6.1z" />
    </Icon>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 16l5-5 3.5 3.5L20 7" />
      <path d="M15 7h5v5" />
    </Icon>
  );
}
