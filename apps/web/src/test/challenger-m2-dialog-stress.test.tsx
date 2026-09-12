import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet, Modal, ModalCloseButton, ConfirmDialog } from "../ui";
import { CommandPalette } from "../views/CommandPalette";

describe("Challenger M2-2: Dialog & Overlay Empirical Stress Tests", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  describe("1. Sheet Focus Trapping & Keyboard Workflows", () => {
    it("traps focus and wraps forward from last element to first (Close button)", () => {
      render(
        <Sheet open={true} title="Forward Wrap Sheet" onClose={vi.fn()}>
          <input data-testid="field-1" />
          <button data-testid="submit-btn">Submit</button>
        </Sheet>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      const submitBtn = screen.getByTestId("submit-btn");

      submitBtn.focus();
      expect(document.activeElement).toBe(submitBtn);

      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);
    });

    it("traps focus and wraps backward from first element (Close button) to last", () => {
      render(
        <Sheet open={true} title="Backward Wrap Sheet" onClose={vi.fn()}>
          <input data-testid="field-1" />
          <button data-testid="submit-btn">Submit</button>
        </Sheet>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      const submitBtn = screen.getByTestId("submit-btn");

      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(submitBtn);
    });

    it("handles single focusable element (only Close button) without leaking", () => {
      render(
        <Sheet open={true} title="Single Focusable Sheet" onClose={vi.fn()}>
          <p>Read-only notification message with no inner inputs</p>
        </Sheet>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      // Forward tab
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);

      // Backward tab
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(closeBtn);
    });

    it("preserves autoFocus on inner element without stealing focus to Close button", async () => {
      render(
        <Sheet open={true} title="AutoFocus Sheet" onClose={vi.fn()}>
          <input data-testid="autofocus-input" autoFocus />
        </Sheet>
      );

      const autofocusInput = screen.getByTestId("autofocus-input");
      autofocusInput.focus();
      expect(document.activeElement).toBe(autofocusInput);

      // Wait for useDialogA11y 10ms timeout
      await new Promise((r) => setTimeout(r, 25));
      expect(document.activeElement).toBe(autofocusInput);
    });

    it("restores focus to trigger button upon Escape dismissal", async () => {
      function TestWrapper() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button data-testid="sheet-trigger" onClick={() => setOpen(true)}>
              Open
            </button>
            <Sheet open={open} title="Restoration Sheet" onClose={() => setOpen(false)}>
              <input data-testid="sheet-input" />
            </Sheet>
          </div>
        );
      }

      render(<TestWrapper />);
      const trigger = screen.getByTestId("sheet-trigger");
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);
      expect(screen.getByText("Restoration Sheet")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Restoration Sheet")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("closes when clicking backdrop but does NOT close when clicking content", () => {
      const onClose = vi.fn();
      render(
        <Sheet open={true} title="Click Test Sheet" onClose={onClose}>
          <div data-testid="sheet-inner-card">
            <p>Clickable inner content</p>
          </div>
        </Sheet>
      );

      // Click inside sheet content -> should NOT close
      fireEvent.click(screen.getByTestId("sheet-inner-card"));
      expect(onClose).not.toHaveBeenCalled();

      // Click backdrop -> should close
      const backdrop = document.querySelector(".sheet-backdrop");
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Modal Focus Trapping & Edge Cases", () => {
    it("traps focus and wraps forward from last button to first button", () => {
      render(
        <Modal title="Wrap Modal" onClose={vi.fn()}>
          <ModalCloseButton onClose={vi.fn()} />
          <button data-testid="modal-action-1">Action 1</button>
          <button data-testid="modal-action-2">Action 2</button>
        </Modal>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      const action2 = screen.getByTestId("modal-action-2");

      action2.focus();
      expect(document.activeElement).toBe(action2);

      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);
    });

    it("traps focus and wraps backward from first button to last button", () => {
      render(
        <Modal title="Wrap Backward Modal" onClose={vi.fn()}>
          <ModalCloseButton onClose={vi.fn()} />
          <button data-testid="modal-action-1">Action 1</button>
          <button data-testid="modal-action-2">Action 2</button>
        </Modal>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      const action2 = screen.getByTestId("modal-action-2");

      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(action2);
    });

    it("handles completely empty modal (0 focusable elements) by trapping focus on modal panel", async () => {
      render(
        <Modal title="Empty Modal" onClose={vi.fn()}>
          <p>Plain text info only with zero buttons or inputs</p>
        </Modal>
      );

      const panel = screen.getByRole("dialog");
      // Wait for useDialogA11y initial focus timeout
      await new Promise((r) => setTimeout(r, 25));

      expect(document.activeElement).toBe(panel);

      // Tab on empty dialog should stay on panel and prevent default
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(panel);

      // Shift+Tab on empty dialog should stay on panel and prevent default
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(panel);
    });

    it("preserves autoFocus inside modal", async () => {
      render(
        <Modal title="Autofocus Modal" onClose={vi.fn()}>
          <ModalCloseButton onClose={vi.fn()} />
          <input data-testid="modal-autofocus" autoFocus />
        </Modal>
      );

      const input = screen.getByTestId("modal-autofocus");
      input.focus();
      expect(document.activeElement).toBe(input);

      await new Promise((r) => setTimeout(r, 25));
      expect(document.activeElement).toBe(input);
    });

    it("restores focus to trigger when Modal is unmounted via Escape", async () => {
      function TestWrapper() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button data-testid="modal-trigger" onClick={() => setOpen(true)}>
              Open Modal
            </button>
            {open && (
              <Modal title="Escape Modal" onClose={() => setOpen(false)}>
                <button data-testid="modal-btn">Inside Modal</button>
              </Modal>
            )}
          </div>
        );
      }

      render(<TestWrapper />);
      const trigger = screen.getByTestId("modal-trigger");
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);
      expect(screen.getByRole("dialog", { name: "Escape Modal" })).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Escape Modal" })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("closes Modal when clicking backdrop but NOT when clicking modal content", () => {
      const onClose = vi.fn();
      render(
        <Modal title="Backdrop Test" onClose={onClose}>
          <div data-testid="modal-content">Inside Content</div>
        </Modal>
      );

      // Click inside modal panel
      fireEvent.click(screen.getByTestId("modal-content"));
      expect(onClose).not.toHaveBeenCalled();

      // Click backdrop
      const backdrop = document.querySelector(".modal-backdrop");
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. CommandPalette Keyboard Workflows & Trapping", () => {
    it("autofocuses input upon opening", () => {
      render(
        <CommandPalette
          open={true}
          setOpen={vi.fn()}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText("Type a command or search...");
      expect(document.activeElement).toBe(input);
    });

    it("restores focus to trigger button upon close", async () => {
      function TestWrapper() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button data-testid="palette-trigger" onClick={() => setOpen(true)}>
              Open Palette
            </button>
            <CommandPalette
              open={open}
              setOpen={setOpen}
              onNavigate={vi.fn()}
              onNewTask={vi.fn()}
              onToggleTheme={vi.fn()}
            />
          </div>
        );
      }

      render(<TestWrapper />);
      const trigger = screen.getByTestId("palette-trigger");
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);
      expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();

      // Trigger close
      const backdrop = document.querySelector(".palette-backdrop");
      fireEvent.click(backdrop!);

      await new Promise((r) => requestAnimationFrame(r));
      expect(document.activeElement).toBe(trigger);
    });

    it("clicking palette panel does NOT dismiss palette", () => {
      const setOpen = vi.fn();
      render(
        <CommandPalette
          open={true}
          setOpen={setOpen}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      const panel = document.querySelector(".palette-panel");
      expect(panel).toBeInTheDocument();
      fireEvent.click(panel!);
      expect(setOpen).not.toHaveBeenCalled();
    });

    it("evaluates Tab behavior when CommandPalette is open", () => {
      // Create an outside background button to detect focus leak
      const outsideBtn = document.createElement("button");
      outsideBtn.textContent = "Outside Background Element";
      document.body.appendChild(outsideBtn);

      render(
        <CommandPalette
          open={true}
          setOpen={vi.fn()}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText("Type a command or search...");
      input.focus();
      expect(document.activeElement).toBe(input);

      // Press Tab while inside CommandPalette
      fireEvent.keyDown(input, { key: "Tab" });

      // In a strict modal dialog, Tab should NOT escape to outsideBtn
      expect(document.activeElement).not.toBe(outsideBtn);

      document.body.removeChild(outsideBtn);
    });
  });

  describe("4. Nested & Stacked Overlays Edge Cases", () => {
    it("STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)", async () => {
      function NestedOverlayFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [confirmOpen, setConfirmOpen] = useState(false);

        return (
          <div>
            <button data-testid="page-trigger">Page Button</button>
            <Sheet open={sheetOpen} title="Parent Sheet" onClose={() => setSheetOpen(false)}>
              <input data-testid="sheet-input-1" placeholder="Task Title" />
              <button data-testid="delete-btn" onClick={() => setConfirmOpen(true)}>
                Delete Task
              </button>

              <ConfirmDialog
                open={confirmOpen}
                title="Confirm Delete"
                message="Are you sure?"
                onConfirm={() => {
                  setConfirmOpen(false);
                  setSheetOpen(false);
                }}
                onCancel={() => setConfirmOpen(false)}
              />
            </Sheet>
          </div>
        );
      }

      render(<NestedOverlayFixture />);

      // Step 1: Sheet is open
      expect(screen.getByText("Parent Sheet")).toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Confirm Delete" })).not.toBeInTheDocument();

      // Step 2: Open ConfirmDialog (Modal stacked on Sheet)
      const deleteBtn = screen.getByTestId("delete-btn");
      deleteBtn.focus();
      fireEvent.click(deleteBtn);

      expect(screen.getByRole("dialog", { name: "Confirm Delete" })).toBeInTheDocument();

      // Wait for ConfirmDialog focus initialization
      await new Promise((r) => setTimeout(r, 25));

      // Step 3: Now both Sheet and ConfirmDialog are mounted.
      // Press Escape.
      // What SHOULD happen: ONLY ConfirmDialog closes! The parent Sheet MUST REMAIN OPEN!
      fireEvent.keyDown(document, { key: "Escape" });

      // Check results:
      const confirmDismissed = screen.queryByRole("dialog", { name: "Confirm Delete" }) === null;
      const sheetStillOpen = screen.queryByText("Parent Sheet") !== null;

      expect(confirmDismissed).toBe(true);
      expect(sheetStillOpen).toBe(true);
    });

    it("STRESS TEST: Focus trapping within topmost overlay when nested", async () => {
      function NestedOverlayFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [confirmOpen, setConfirmOpen] = useState(false);

        return (
          <div>
            <Sheet open={sheetOpen} title="Parent Sheet" onClose={() => setSheetOpen(false)}>
              <input data-testid="sheet-input-1" placeholder="Task Title" />
              <button data-testid="delete-btn" onClick={() => setConfirmOpen(true)}>
                Delete Task
              </button>

              <ConfirmDialog
                open={confirmOpen}
                title="Confirm Delete"
                message="Are you sure?"
                onConfirm={() => setConfirmOpen(false)}
                onCancel={() => setConfirmOpen(false)}
              />
            </Sheet>
          </div>
        );
      }

      render(<NestedOverlayFixture />);
      const deleteBtn = screen.getByTestId("delete-btn");
      fireEvent.click(deleteBtn);

      expect(screen.getByRole("dialog", { name: "Confirm Delete" })).toBeInTheDocument();
      await new Promise((r) => setTimeout(r, 25));

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      const confirmBtn = screen.getByRole("button", { name: "Confirm" });
      const sheetCloseBtn = screen.getByRole("button", { name: "Close" });
      const sheetInput = screen.getByTestId("sheet-input-1");

      // While ConfirmDialog is open, focus on Confirm button and press Tab:
      confirmBtn.focus();
      expect(document.activeElement).toBe(confirmBtn);

      fireEvent.keyDown(document, { key: "Tab" });

      // It should NOT jump to Sheet's close button or Sheet's input!
      expect(document.activeElement).not.toBe(sheetCloseBtn);
      expect(document.activeElement).not.toBe(sheetInput);
      // It should wrap to Cancel button inside ConfirmDialog
      expect(document.activeElement).toBe(cancelBtn);
    });

    it("STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape", async () => {
      function SheetWithPalette() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [paletteOpen, setPaletteOpen] = useState(false);

        return (
          <div>
            <Sheet open={sheetOpen} title="Open Task Sheet" onClose={() => setSheetOpen(false)}>
              <input data-testid="task-title-input" />
              <button data-testid="open-palette-btn" onClick={() => setPaletteOpen(true)}>
                Palette
              </button>
            </Sheet>

            <CommandPalette
              open={paletteOpen}
              setOpen={setPaletteOpen}
              onNavigate={vi.fn()}
              onNewTask={vi.fn()}
              onToggleTheme={vi.fn()}
            />
          </div>
        );
      }

      render(<SheetWithPalette />);
      expect(screen.getByText("Open Task Sheet")).toBeInTheDocument();

      // Open palette
      const paletteBtn = screen.getByTestId("open-palette-btn");
      fireEvent.click(paletteBtn);

      expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();

      // Press Escape to dismiss CommandPalette
      fireEvent.keyDown(document, { key: "Escape" });

      // What SHOULD happen: CommandPalette closes, but Sheet MUST REMAIN OPEN!
      const paletteClosed = screen.queryByPlaceholderText("Type a command or search...") === null;
      const sheetOpen = screen.queryByText("Open Task Sheet") !== null;

      expect(paletteClosed).toBe(true);
      expect(sheetOpen).toBe(true);
    });

    it("STRESS TEST: Stacked Modal on Modal, pressing Escape", async () => {
      function StackedModals() {
        const [modalAOpen, setModalAOpen] = useState(true);
        const [modalBOpen, setModalBOpen] = useState(false);

        return (
          <div>
            {modalAOpen && (
              <Modal title="Modal A" onClose={() => setModalAOpen(false)}>
                <button data-testid="open-modal-b" onClick={() => setModalBOpen(true)}>
                  Open B
                </button>
              </Modal>
            )}
            {modalBOpen && (
              <Modal title="Modal B" onClose={() => setModalBOpen(false)}>
                <p>Content B</p>
              </Modal>
            )}
          </div>
        );
      }

      render(<StackedModals />);
      expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("open-modal-b"));
      expect(screen.getByRole("dialog", { name: "Modal B" })).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" });

      // What SHOULD happen: ONLY Modal B closes! Modal A must remain open!
      const modalBClosed = screen.queryByRole("dialog", { name: "Modal B" }) === null;
      const modalAOpen = screen.queryByRole("dialog", { name: "Modal A" }) !== null;

      expect(modalBClosed).toBe(true);
      expect(modalAOpen).toBe(true);
    });
  });
});
