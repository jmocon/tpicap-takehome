import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("exposes itself as a labelled modal dialog", () => {
    render(
      <Modal label="Create trade" onClose={vi.fn()}>
        <button type="button">Submit</button>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Create trade" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus to the first focusable element on open", () => {
    render(
      <Modal label="Create trade" onClose={vi.fn()}>
        <input aria-label="Symbol" />
        <button type="button">Submit</button>
      </Modal>,
    );

    expect(screen.getByLabelText("Symbol")).toHaveFocus();
  });

  it("falls back to focusing the dialog itself when it has no focusable content", () => {
    render(
      <Modal label="Trade history" onClose={vi.fn()}>
        <p>Loading…</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("closes on Escape from anywhere on the page", () => {
    const onClose = vi.fn();
    render(
      <Modal label="Create trade" onClose={onClose}>
        <button type="button">Submit</button>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops listening for Escape once unmounted", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal label="Create trade" onClose={onClose}>
        <button type="button">Submit</button>
      </Modal>,
    );

    unmount();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a backdrop click but not on a click inside the dialog", () => {
    const onClose = vi.fn();
    render(
      <Modal label="Create trade" onClose={onClose}>
        <button type="button">Submit</button>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
