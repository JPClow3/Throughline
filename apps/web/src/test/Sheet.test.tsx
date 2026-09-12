import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "../ui";
import React from "react";

describe("Sheet", () => {
  it("renders when open and handles close", () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} title="Test Sheet" onClose={onClose}>
        <div>Sheet content</div>
      </Sheet>
    );

    expect(screen.getByText("Test Sheet")).toBeInTheDocument();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("handles Escape key to close", () => {
    const onClose = vi.fn();
    render(
      <Sheet open={true} title="Escape Sheet" onClose={onClose}>
        <input type="text" data-testid="sheet-input" />
      </Sheet>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when not open", () => {
    render(
      <Sheet open={false} title="Closed Sheet" onClose={vi.fn()}>
        <div>Hidden content</div>
      </Sheet>
    );

    expect(screen.queryByText("Closed Sheet")).not.toBeInTheDocument();
  });

  it("traps focus between first and last focusable element on Tab and Shift+Tab", () => {
    render(
      <Sheet open={true} title="Trap Sheet" onClose={vi.fn()}>
        <input data-testid="input-1" />
        <button data-testid="btn-2">Action</button>
      </Sheet>
    );

    const closeBtn = screen.getByRole("button", { name: "Close" });
    const btn2 = screen.getByTestId("btn-2");

    // Tab from last element wraps to first (close button)
    btn2.focus();
    expect(document.activeElement).toBe(btn2);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first element wraps to last
    closeBtn.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(btn2);
  });

  it("restores focus to previous active element upon Escape dismissal", async () => {
    function TestWrapper() {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          <button data-testid="trigger-btn" onClick={() => setOpen(true)}>
            Open Sheet
          </button>
          <Sheet open={open} title="Restoration Sheet" onClose={() => setOpen(false)}>
            <input data-testid="inner-input" />
          </Sheet>
        </div>
      );
    }

    render(<TestWrapper />);
    const trigger = screen.getByTestId("trigger-btn");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByText("Restoration Sheet")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Restoration Sheet")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("preserves focus on autofocus element inside sheet", async () => {
    render(
      <Sheet open={true} title="Autofocus Sheet" onClose={vi.fn()}>
        <input data-testid="autofocus-input" autoFocus />
      </Sheet>
    );

    const input = screen.getByTestId("autofocus-input");
    input.focus();
    expect(document.activeElement).toBe(input);

    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(document.activeElement).toBe(input);
  });

  it("stops propagation on Escape keydown", () => {
    const parentKeyHandler = vi.fn();
    document.addEventListener("keydown", parentKeyHandler);

    render(
      <Sheet open={true} title="Escape Stop Sheet" onClose={vi.fn()}>
        <div>Content</div>
      </Sheet>
    );

    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true
    });
    const stopPropagationSpy = vi.spyOn(escapeEvent, "stopPropagation");

    document.dispatchEvent(escapeEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
    document.removeEventListener("keydown", parentKeyHandler);
  });
});

