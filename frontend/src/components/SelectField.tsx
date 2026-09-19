import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "./icons";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional leading glyph, rendered inside the control ahead of the value. */
  icon?: ReactNode;
}

/**
 * A native `<select>` dressed to match the icon buttons beside it.
 *
 * Still a real `<select>` — keyboard behaviour, the native option list and
 * mobile pickers all come for free. The wrapper only supplies the chrome the
 * platform control can't style: a leading icon, a consistent chevron (the
 * built-in one is suppressed via `appearance: none`), and the same height,
 * radius and border as the buttons it sits next to.
 */
export function SelectField({ icon, className, children, ...selectProps }: SelectFieldProps) {
  return (
    <span className={className ? `select-field ${className}` : "select-field"}>
      {icon && <span className="select-field-icon">{icon}</span>}
      <select {...selectProps}>{children}</select>
      <span className="select-field-chevron" aria-hidden="true">
        <ChevronDownIcon size={14} />
      </span>
    </span>
  );
}
