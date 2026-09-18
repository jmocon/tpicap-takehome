import { useEffect, useRef } from "react";

/**
 * Drives a repeating async action on a fixed interval while `enabled` is
 * true. Backs the "Auto Simulate" toggle so a demo can fire simulated
 * trades unattended at an adjustable frequency.
 *
 * - Skips a tick (rather than queueing it) if the previous invocation of
 *   `action` hasn't resolved yet, so a slow request can't pile up overlapping
 *   calls.
 * - Changing `intervalMs` while `enabled` is true reschedules the interval
 *   with the new period on its next tick, without needing `enabled` to be
 *   toggled off and back on.
 * - The interval is always cleared on `enabled` going false, `intervalMs`
 *   changing, or unmount.
 */
export function useAutoSimulate(action: () => Promise<unknown>, intervalMs: number, enabled: boolean): void {
  // Kept in a ref so the effect below doesn't need `action` in its
  // dependency array — callers can pass a fresh closure every render
  // without restarting the interval. Assigned in an effect (not during
  // render) so this doesn't trip the "no ref writes during render" rule.
  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  });

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      if (inFlightRef.current) return; // previous tick still in flight — skip this one
      inFlightRef.current = true;
      Promise.resolve(actionRef.current())
        .catch(() => {
          // The action (handleSimulateTrade) already surfaces its own
          // errors via component state; swallow here so a rejection can't
          // break the interval loop.
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
