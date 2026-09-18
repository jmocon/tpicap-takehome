import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  /** Accessible name for the dialog, announced when focus moves into it. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/** Everything a user can tab to — used to place initial focus. */
const FOCUSABLE_SELECTOR =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function Modal({ label, onClose, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // Held in a ref so the Escape listener is attached exactly once per mount,
  // even though callers pass a fresh inline onClose on every render — the
  // same pattern use-trade-socket.ts uses for its event handler.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    // On document, not the dialog: Escape must work no matter where focus
    // currently sits (including the backdrop itself).
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Move focus into the dialog on open, otherwise it stays on the trigger
    // behind the backdrop and keyboard users have to tab through the whole
    // page to reach the form. Falls back to the dialog container (tabIndex
    // -1) when it has no focusable content yet, e.g. while history loads.
    const first = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? contentRef.current)?.focus();
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
