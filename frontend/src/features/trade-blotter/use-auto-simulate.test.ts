import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoSimulate } from "./use-auto-simulate";

describe("useAutoSimulate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call the action when disabled", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSimulate(action, 1000, false));

    await vi.advanceTimersByTimeAsync(5000);

    expect(action).not.toHaveBeenCalled();
  });

  it("calls the action once per interval while enabled", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutoSimulate(action, 1000, true));

    await vi.advanceTimersByTimeAsync(3500);

    expect(action).toHaveBeenCalledTimes(3);
  });

  it("skips a tick if the previous call hasn't resolved yet", async () => {
    let resolveFirst: () => void = () => {};
    const first = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const action = vi.fn().mockImplementationOnce(() => first).mockResolvedValue(undefined);

    renderHook(() => useAutoSimulate(action, 1000, true));

    // Two ticks pass while the first call is still pending — only the first
    // tick should have invoked the action; the second is skipped.
    await vi.advanceTimersByTimeAsync(2500);
    expect(action).toHaveBeenCalledTimes(1);

    resolveFirst();
    await vi.advanceTimersByTimeAsync(0);

    // Now that the first call has resolved, subsequent ticks fire again.
    await vi.advanceTimersByTimeAsync(1000);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("does not let a rejected call break the interval loop", async () => {
    const action = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);
    renderHook(() => useAutoSimulate(action, 1000, true));

    await vi.advanceTimersByTimeAsync(2500);

    expect(action).toHaveBeenCalledTimes(2);
  });

  it("applies a changed interval on the next tick without a restart", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ intervalMs }) => useAutoSimulate(action, intervalMs, true), {
      initialProps: { intervalMs: 1000 },
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(action).toHaveBeenCalledTimes(1);

    rerender({ intervalMs: 5000 });

    await vi.advanceTimersByTimeAsync(1000);
    expect(action).toHaveBeenCalledTimes(1); // hasn't fired again yet at the old cadence

    await vi.advanceTimersByTimeAsync(4000);
    expect(action).toHaveBeenCalledTimes(2); // fires once the new 5s period elapses
  });

  it("clears the interval when disabled", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(({ enabled }) => useAutoSimulate(action, 1000, enabled), {
      initialProps: { enabled: true },
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(action).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    await vi.advanceTimersByTimeAsync(5000);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutoSimulate(action, 1000, true));

    await vi.advanceTimersByTimeAsync(1000);
    expect(action).toHaveBeenCalledTimes(1);

    unmount();

    await vi.advanceTimersByTimeAsync(5000);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
