import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { filterSuggestions } from "./trade-filters-suggestions";

const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 8;

interface FilterSuggestInputProps {
  className?: string;
  /** Optional leading glyph rendered inside the field, ahead of the text. */
  icon?: ReactNode;
  placeholder: string;
  ariaLabel: string;
  // The committed filter value driving the actual fetch (from the parent's
  // query state) — the source of truth this input syncs to/from.
  value: string;
  // Candidate values to suggest from (e.g. every symbol/trader seen in the
  // currently-loaded trades) — filtered client-side, no extra request.
  candidates: string[];
  onCommit: (value: string) => void;
}

// A text input that (a) updates its own display instantly on every keystroke
// but only propagates to `onCommit` ~300ms after typing settles, and (b)
// shows a small dropdown of matching candidate values, selecting one commits
// immediately (no debounce wait).
export function FilterSuggestInput({
  className,
  icon,
  placeholder,
  ariaLabel,
  value,
  candidates,
  onCommit,
}: FilterSuggestInputProps) {
  const [text, setText] = useState(value);
  // Tracks the last `value` we've synced `text` from, so we can tell "the
  // committed filter changed elsewhere (e.g. a reset)" apart from "we're
  // still mid-debounce for a value the parent hasn't caught up to yet".
  const [syncedValue, setSyncedValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // React's recommended way to reset derived state when a prop changes:
  // adjust it directly during render rather than in an effect (which would
  // mean an extra "commit, then immediately re-render" cascade).
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value);
  }

  // Always call the latest onCommit/committed-value from the debounce timer,
  // even though the timer itself is only (re)scheduled when `text` changes —
  // otherwise a stale closure could clobber an unrelated filter field (e.g.
  // the side/status selects) that changed while this debounce was pending.
  // Assigned in an effect (not during render) per this repo's convention for
  // keeping a ref fresh without tripping the "no ref writes during render" rule.
  const onCommitRef = useRef(onCommit);
  const committedRef = useRef(value);
  useEffect(() => {
    onCommitRef.current = onCommit;
    committedRef.current = value;
  });

  useEffect(() => {
    if (text === committedRef.current) return;
    const timeout = setTimeout(() => onCommitRef.current(text), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [text]);

  const suggestions = useMemo(() => filterSuggestions(candidates, text, MAX_SUGGESTIONS), [candidates, text]);
  const showDropdown = open && suggestions.length > 0;

  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  function selectSuggestion(suggestion: string) {
    setText(suggestion);
    setOpen(false);
    setActiveIndex(-1);
    onCommit(suggestion);
  }

  function handleChange(next: string) {
    setText(next);
    setActiveIndex(-1);
    setOpen(next.trim() !== "");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]!);
    }
  }

  return (
    // `className` lands on the wrapper, not the field: the wrapper is the flex
    // item inside .trade-filters, so it's what sizing rules have to target.
    <div className={className ? `filter-suggest ${className}` : "filter-suggest"} ref={containerRef}>
      <span className="input-field">
        {icon && <span className="input-field-icon">{icon}</span>}
        <input
          type="text"
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(text.trim() !== "")}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </span>
      {showDropdown && (
        <ul className="filter-suggest-dropdown" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "filter-suggest-option active" : "filter-suggest-option"}
              onMouseDown={(e) => {
                // mousedown (before the input's blur) so this fires before
                // any click-outside/blur logic would otherwise close it first.
                e.preventDefault();
                selectSuggestion(suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
