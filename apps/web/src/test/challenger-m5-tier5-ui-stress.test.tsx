import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Sheet, Modal, ConfirmDialog, IconButton, Chip } from "../ui";
import { dialogStack } from "../ui/dialogA11y";
import { CommandPalette } from "../views/CommandPalette";
import { TaskCard } from "../views/TaskCard";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { makeTask } from "./planner-test-utils";
import { clearAllData, saveAppearanceSettings } from "../data/repositories";

function stubMatchMedia(matchingQuery?: string | ((query: string) => boolean)) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: typeof matchingQuery === "function" ? matchingQuery(query) : query === matchingQuery,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
  return () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  };
}

describe("Tier 5 Adversarial Hardening: UI Press Physics, Focus Trapping & Gesture/Navigation", () => {
  beforeEach(async () => {
    await clearAllData();
    await saveAppearanceSettings({ hasCompletedOnboarding: true });
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

  afterEach(() => {
    dialogStack.length = 0;
  });

  // =========================================================================
  // 1. NESTED DIALOG STACKING, RAPID FOCUS CHANGES & ESCAPE PRIORITY
  // =========================================================================
  describe("1. Nested Dialog Stacking & Escape Priority", () => {
    it("STRESS 1.1: 3-tier nested dialogs (Sheet -> Modal -> ConfirmDialog) respect strict LIFO across consecutive Escapes", async () => {
      function TripleStack() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(false);
        const [confirmOpen, setConfirmOpen] = useState(false);

        return (
          <div>
            <button data-testid="base-trigger">Base Page</button>
            <Sheet open={sheetOpen} title="Base Sheet" onClose={() => setSheetOpen(false)}>
              <button data-testid="open-modal-btn" onClick={() => setModalOpen(true)}>
                Open Modal
              </button>
              {modalOpen && (
                <Modal title="Nested Modal" onClose={() => setModalOpen(false)}>
                  <button data-testid="open-confirm-btn" onClick={() => setConfirmOpen(true)}>
                    Open Confirm
                  </button>
                  <ConfirmDialog
                    open={confirmOpen}
                    title="Confirm Action"
                    message="Are you sure?"
                    onConfirm={() => setConfirmOpen(false)}
                    onCancel={() => setConfirmOpen(false)}
                  />
                </Modal>
              )}
            </Sheet>
          </div>
        );
      }

      render(<TripleStack />);

      // Base Sheet is open
      expect(screen.getByRole("dialog", { name: "Base Sheet" })).toBeInTheDocument();

      // Open Modal
      fireEvent.click(screen.getByTestId("open-modal-btn"));
      expect(screen.getByRole("dialog", { name: "Nested Modal" })).toBeInTheDocument();

      // Open ConfirmDialog
      fireEvent.click(screen.getByTestId("open-confirm-btn"));
      expect(screen.getByRole("dialog", { name: "Confirm Action" })).toBeInTheDocument();

      // Verify all 3 dialogs are mounted in DOM
      expect(screen.getByRole("dialog", { name: "Base Sheet" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Nested Modal" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Confirm Action" })).toBeInTheDocument();

      // 1st Escape -> Closes ONLY ConfirmDialog (topmost)
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Confirm Action" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Nested Modal" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Base Sheet" })).toBeInTheDocument();

      // 2nd Escape -> Closes ONLY Nested Modal
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Nested Modal" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Base Sheet" })).toBeInTheDocument();

      // 3rd Escape -> Closes Base Sheet
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Base Sheet" })).not.toBeInTheDocument();
    });

    it("STRESS 1.2: CommandPalette takes absolute topmost precedence over an active Sheet", async () => {
      function SheetWithPalette() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [paletteOpen, setPaletteOpen] = useState(false);

        return (
          <div>
            <Sheet open={sheetOpen} title="Editor Sheet" onClose={() => setSheetOpen(false)}>
              <button data-testid="open-palette-btn" onClick={() => setPaletteOpen(true)}>
                Launch Palette
              </button>
            </Sheet>
            <CommandPalette
              open={paletteOpen}
              setOpen={setPaletteOpen}
              onNavigate={() => {}}
              onNewTask={() => {}}
              onToggleTheme={() => {}}
            />
          </div>
        );
      }

      render(<SheetWithPalette />);
      expect(screen.getByRole("dialog", { name: "Editor Sheet" })).toBeInTheDocument();

      // Open CommandPalette
      fireEvent.click(screen.getByTestId("open-palette-btn"));
      expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
      // Underlying sheet remains mounted in DOM (with aria-hidden="true" applied by radix dialog)
      expect(screen.getByRole("dialog", { name: "Editor Sheet", hidden: true })).toBeInTheDocument();

      // Press Escape -> Should close ONLY CommandPalette
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
      // Sheet returns to active accessible view
      expect(screen.getByRole("dialog", { name: "Editor Sheet" })).toBeInTheDocument();

      // Next Escape -> Closes Editor Sheet
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Editor Sheet" })).not.toBeInTheDocument();
    });

    it("STRESS 1.3: Rapid consecutive Escape bursts are handled cleanly without exceptions or zombie state", async () => {
      function StackedPair() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(true);

        return (
          <div>
            <Sheet open={sheetOpen} title="Sheet Base" onClose={() => setSheetOpen(false)}>
              {modalOpen && (
                <Modal title="Modal Child" onClose={() => setModalOpen(false)}>
                  <p>Child Content</p>
                </Modal>
              )}
            </Sheet>
          </div>
        );
      }

      render(<StackedPair />);
      expect(screen.getByRole("dialog", { name: "Sheet Base" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Modal Child" })).toBeInTheDocument();

      // Burst 8 consecutive Escapes in immediate succession
      for (let i = 0; i < 8; i++) {
        fireEvent.keyDown(document, { key: "Escape" });
      }

      // Both dialogs must be closed
      expect(screen.queryByRole("dialog", { name: "Modal Child" })).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Sheet Base" })).not.toBeInTheDocument();
    });

    it("STRESS 1.4: Escape inside an inner text input in a dialog dismisses the dialog cleanly", async () => {
      function SheetWithInput() {
        const [open, setOpen] = useState(true);
        return (
          <Sheet open={open} title="Sheet with Input" onClose={() => setOpen(false)}>
            <input data-testid="nested-input" type="text" placeholder="Type here..." />
          </Sheet>
        );
      }

      render(<SheetWithInput />);
      const input = screen.getByTestId("nested-input");
      input.focus();

      // Fire Escape while focused on the inner input
      fireEvent.keyDown(input, { key: "Escape" });

      expect(screen.queryByRole("dialog", { name: "Sheet with Input" })).not.toBeInTheDocument();
    });

    it("STRESS 1.5: Focus trap boundary conditions: wrapping forward on last element and backward on first element", async () => {
      function FocusTrapModal() {
        return (
          <Modal title="Trap Test" onClose={() => {}}>
            <button data-testid="first-btn">First</button>
            <input data-testid="middle-input" type="text" />
            <button data-testid="last-btn">Last</button>
          </Modal>
        );
      }

      render(<FocusTrapModal />);
      const firstBtn = screen.getByTestId("first-btn");
      const lastBtn = screen.getByTestId("last-btn");

      // 1. Shift+Tab on first element wraps around to last element
      firstBtn.focus();
      expect(document.activeElement).toBe(firstBtn);
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(lastBtn);

      // 2. Tab on last element wraps around to first element
      lastBtn.focus();
      expect(document.activeElement).toBe(lastBtn);
      fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
      expect(document.activeElement).toBe(firstBtn);
    });

    it("STRESS 1.6: External focus redirected into dialog upon Tab", async () => {
      function TrapRedirect() {
        return (
          <div>
            <button data-testid="outside-btn">Outside</button>
            <Modal title="Trap Redirect" onClose={() => {}}>
              <button data-testid="inside-btn">Inside</button>
            </Modal>
          </div>
        );
      }

      render(<TrapRedirect />);
      const outsideBtn = screen.getByTestId("outside-btn");
      const insideBtn = screen.getByTestId("inside-btn");

      outsideBtn.focus();
      expect(document.activeElement).toBe(outsideBtn);

      // Pressing Tab while outside redirects focus inside the modal
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(insideBtn);
    });

    it("STRESS 1.7: Dialog with zero focusable elements traps focus safely on panel container", async () => {
      function NonFocusableModal() {
        return (
          <Modal title="Static Modal" onClose={() => {}}>
            <p>Only static text</p>
          </Modal>
        );
      }

      render(<NonFocusableModal />);
      const panel = screen.getByRole("dialog", { name: "Static Modal" });

      // Tab keydown on static dialog should focus panel itself without throwing
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(panel);
    });

    it("STRESS 1.8: Focus is restored to trigger element upon closing Sheet via Escape", async () => {
      function TriggerAndSheet() {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button data-testid="trigger-btn" onClick={() => setOpen(true)}>
              Open Trigger
            </button>
            <Sheet open={open} title="Restored Sheet" onClose={() => setOpen(false)}>
              <p>Sheet body</p>
            </Sheet>
          </div>
        );
      }

      render(<TriggerAndSheet />);
      const trigger = screen.getByTestId("trigger-btn");
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Open sheet
      fireEvent.click(trigger);
      expect(screen.getByRole("dialog", { name: "Restored Sheet" })).toBeInTheDocument();

      // Close sheet via Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Restored Sheet" })).not.toBeInTheDocument();

      // Focus should return to the original trigger button
      expect(document.activeElement).toBe(trigger);
    });

    it("STRESS 1.9: Disconnected/abruptly unmounted dialog entries are purged automatically", async () => {
      function AbruptUnmountTest() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [showChild, setShowChild] = useState(true);

        return (
          <div>
            <Sheet open={sheetOpen} title="Parent Sheet" onClose={() => setSheetOpen(false)}>
              {showChild && (
                <Modal title="Zombie Candidate Modal" onClose={() => {}}>
                  <p>Child</p>
                </Modal>
              )}
              <button data-testid="kill-child-btn" onClick={() => setShowChild(false)}>
                Kill Child Abruptly
              </button>
            </Sheet>
          </div>
        );
      }

      render(<AbruptUnmountTest />);
      expect(screen.getByRole("dialog", { name: "Zombie Candidate Modal" })).toBeInTheDocument();

      // Abruptly unmount child without triggering its onClose callback
      fireEvent.click(screen.getByTestId("kill-child-btn"));
      expect(screen.queryByRole("dialog", { name: "Zombie Candidate Modal" })).not.toBeInTheDocument();

      // Next Escape should cleanly close Parent Sheet, because dead child ref was purged
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Parent Sheet" })).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. TOUCH TARGET COMPLIANCE (MINIMUM 44x44px BOUNDING AREA ON MOBILE)
  // =========================================================================
  describe("2. Touch Target Compliance (Minimum 44x44px Bounding Area)", () => {
    const cssPath = path.resolve(__dirname, "../styles.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    it("STRESS 2.1: .icon-toggle expands to min 44x44px under pointer: coarse and max-width: 640px", () => {
      const match = cssContent.match(/@media\s*\([^)]*pointer:\s*coarse[^)]*\)[^{]*\{[\s\S]*?\.icon-toggle\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
      expect(match).not.toBeNull();
    });

    it("STRESS 2.2: .btn-sm expands to min-height: 44px under pointer: coarse and max-width: 640px", () => {
      const match = cssContent.match(/@media\s*\([^)]*pointer:\s*coarse[^)]*\)[^{]*\{[\s\S]*?\.btn-sm\s*\{[\s\S]*?min-height:\s*44px/);
      expect(match).not.toBeNull();
    });

    it("STRESS 2.3: Baseline --control-h is set to 44px ensuring default buttons and inputs meet touch size", () => {
      expect(cssContent).toMatch(/--control-h:\s*44px;/);
      expect(cssContent).toMatch(/\.btn\s*\{[\s\S]*?min-height:\s*var\(--control-h\);/);
      expect(cssContent).toMatch(/\.input\s*\{[\s\S]*?min-height:\s*var\(--control-h\);/);
    });

    it("STRESS 2.4: .chip and segmented filters expand to min-height: 44px on mobile", () => {
      const match = cssContent.match(/@media\s*\([^)]*pointer:\s*coarse[^)]*\)[^{]*\{[\s\S]*?\.chip\s*\{[\s\S]*?min-height:\s*44px/);
      expect(match).not.toBeNull();
    });

    it("STRESS 2.5: Mobile floating primary action (FAB) exceeds 44x44px touch bounding area", () => {
      const match = cssContent.match(/\.shell-mobile-primary-action\s*\{[\s\S]*?width:\s*58px;[\s\S]*?height:\s*58px;/);
      expect(match).not.toBeNull();
    });

    it("STRESS 2.6: Mobile bottom dock links (.dock-link) have min-width: 54px exceeding 44px requirement", () => {
      const match = cssContent.match(/\.dock-link\s*\{[\s\S]*?min-width:\s*54px;/);
      expect(match).not.toBeNull();
    });

    it("STRESS 2.7: Adversarial Audit: Secondary inline controls (.complete-button & .note-link-unlink) dimensions", () => {
      // In TaskCard: .complete-button is 34x34px base
      const completeMatch = cssContent.match(/\.complete-button\s*\{[\s\S]*?width:\s*34px;[\s\S]*?height:\s*34px;/);
      expect(completeMatch).not.toBeNull();

      // In Notes: .note-link-unlink is 26x26px base
      const unlinkMatch = cssContent.match(/\.note-link-unlink\s*\{[\s\S]*?width:\s*26px;[\s\S]*?height:\s*26px;/);
      expect(unlinkMatch).not.toBeNull();
    });

    it("STRESS 2.8: Rendered component touch classes: IconButton and Chip render compliant classes", () => {
      const { container: btnContainer } = render(
        <IconButton label="Settings" size="sm">
          <span>Icon</span>
        </IconButton>
      );
      const button = btnContainer.querySelector("button");
      expect(button).toHaveClass("btn");
      expect(button).toHaveClass("btn-sm");

      const { container: chipContainer } = render(<Chip>Filter Chip</Chip>);
      const chip = chipContainer.querySelector("button");
      expect(chip).toHaveClass("chip");
    });
  });

  // =========================================================================
  // 3. KEYBOARD SHORTCUT ISOLATION (TYPING IN INPUTS NEVER FIRES GLOBAL 'N')
  // =========================================================================
  describe("3. Keyboard Shortcut Isolation", () => {
    it("STRESS 3.1: Typing 'n' or 'N' in an <input type='text'> never triggers task composer", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Create and focus a text input on document
      const testInput = document.createElement("input");
      testInput.type = "text";
      testInput.setAttribute("data-testid", "stress-text-input");
      document.body.appendChild(testInput);

      testInput.focus();
      expect(document.activeElement).toBe(testInput);

      // Dispatch 'n' and 'N' keydown on input
      const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      testInput.dispatchEvent(eventN);
      expect(eventN.defaultPrevented).toBe(false);

      const eventShiftN = new KeyboardEvent("keydown", { key: "N", bubbles: true, cancelable: true });
      testInput.dispatchEvent(eventShiftN);
      expect(eventShiftN.defaultPrevented).toBe(false);

      // Composer dialog should NOT have opened
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(testInput);
    });

    it("STRESS 3.2: Typing 'n' or 'N' in a <textarea> never triggers task composer", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const testTextarea = document.createElement("textarea");
      testTextarea.setAttribute("data-testid", "stress-textarea");
      document.body.appendChild(testTextarea);

      testTextarea.focus();
      expect(document.activeElement).toBe(testTextarea);

      const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      testTextarea.dispatchEvent(eventN);
      expect(eventN.defaultPrevented).toBe(false);

      const eventShiftN = new KeyboardEvent("keydown", { key: "N", bubbles: true, cancelable: true });
      testTextarea.dispatchEvent(eventShiftN);
      expect(eventShiftN.defaultPrevented).toBe(false);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(testTextarea);
    });

    it("STRESS 3.3: Typing 'n' or 'N' in a <select> never triggers task composer", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const testSelect = document.createElement("select");
      const opt = document.createElement("option");
      opt.value = "val";
      opt.text = "Val";
      testSelect.appendChild(opt);
      document.body.appendChild(testSelect);

      testSelect.focus();
      expect(document.activeElement).toBe(testSelect);

      const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      testSelect.dispatchEvent(eventN);
      expect(eventN.defaultPrevented).toBe(false);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(testSelect);
    });

    it("STRESS 3.4: Typing 'n' or 'N' in a contenteditable element never triggers task composer", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const editable = document.createElement("div");
      editable.contentEditable = "true";
      editable.tabIndex = 0;
      document.body.appendChild(editable);

      editable.focus();
      expect(document.activeElement).toBe(editable);

      const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      editable.dispatchEvent(eventN);
      expect(eventN.defaultPrevented).toBe(false);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(editable);
    });

    it("STRESS 3.5: Modifier combinations (Ctrl+N, Alt+N, Meta+N) do NOT trigger task composer", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const button = document.createElement("button");
      document.body.appendChild(button);
      button.focus();

      // Ctrl+N
      const ctrlN = new KeyboardEvent("keydown", { key: "n", ctrlKey: true, bubbles: true, cancelable: true });
      button.dispatchEvent(ctrlN);
      expect(ctrlN.defaultPrevented).toBe(false);
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      // Alt+N
      const altN = new KeyboardEvent("keydown", { key: "n", altKey: true, bubbles: true, cancelable: true });
      button.dispatchEvent(altN);
      expect(altN.defaultPrevented).toBe(false);
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      // Meta+N (Cmd+N)
      const metaN = new KeyboardEvent("keydown", { key: "n", metaKey: true, bubbles: true, cancelable: true });
      button.dispatchEvent(metaN);
      expect(metaN.defaultPrevented).toBe(false);
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(button);
    });

    it("STRESS 3.6: Global 'n' and 'N' outside inputs triggers task composer when dispatched on element targets", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Create a focused non-input button on document body
      const pageBtn = document.createElement("button");
      pageBtn.setAttribute("data-testid", "page-target-btn");
      document.body.appendChild(pageBtn);
      pageBtn.focus();

      // Lowercase 'n' on page element
      fireEvent.keyDown(pageBtn, { key: "n" });
      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "New task" })).toBeInTheDocument();
      });

      // Close it with Escape
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
      });

      // Uppercase 'N' (Shift+N)
      pageBtn.focus();
      fireEvent.keyDown(pageBtn, { key: "N" });
      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "New task" })).toBeInTheDocument();
      });

      // Close again
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
      });

      document.body.removeChild(pageBtn);
    });

    it("STRESS 3.7: Typing navigation keys inside an active input never switches the current view", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // We start on dashboard view: find Today tab link
      const todayLink = screen.getAllByRole("link", { name: "Today" })[0];
      expect(todayLink).toHaveAttribute("aria-current", "page");

      // Focus an input
      const testInput = document.createElement("input");
      testInput.type = "text";
      document.body.appendChild(testInput);
      testInput.focus();

      // Dispatch letters that might represent navigation: k (kanban), g (goals), t (timeline)
      for (const char of ["k", "g", "t", "c", "i", "s", "1", "2", "3"]) {
        const ev = new KeyboardEvent("keydown", { key: char, bubbles: true, cancelable: true });
        testInput.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
      }

      // Today tab link must STILL have aria-current="page"
      expect(todayLink).toHaveAttribute("aria-current", "page");

      document.body.removeChild(testInput);
    });

    it("STRESS 3.8: Bug Verification: target?.closest without element guard throws TypeError when event target is Document", () => {
      // White-box test verifying the exact vulnerability observed in App.tsx:320
      // when event.target is Document (which does not implement Element.prototype.closest)
      const doc = document;
      expect((doc as unknown as { closest?: unknown }).closest).toBeUndefined();

      // Calling closest on a non-element target produces TypeError
      const testFn = () => {
        const target = doc as unknown as HTMLElement;
        return target.closest("input");
      };
      expect(testFn).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 4. ZERO-MOTION / REDUCED-MOTION ACCESSIBILITY PREFERENCES
  // =========================================================================
  describe("4. Zero-Motion / Reduced-Motion Accessibility Preferences", () => {
    const cssPath = path.resolve(__dirname, "../styles.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    it("STRESS 4.1: CSS global reduced-motion kill-switch sets 0.01ms animations and transitions", () => {
      const match = cssContent.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\*,\s*\*::before,\s*\*::after\s*\{[\s\S]*?animation-duration:\s*0\.01ms\s*!important;[\s\S]*?animation-iteration-count:\s*1\s*!important;[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/);
      expect(match).not.toBeNull();
    });

    it("STRESS 4.2: .goal-ring disables transition under prefers-reduced-motion: reduce", () => {
      const match = cssContent.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.goal-ring\s*\{[\s\S]*?transition:\s*none;/);
      expect(match).not.toBeNull();
    });

    it("STRESS 4.3: Framer Motion top-level MotionConfig is configured with reducedMotion='user'", () => {
      const mainPath = path.resolve(__dirname, "../main.tsx");
      const mainContent = fs.readFileSync(mainPath, "utf-8");
      expect(mainContent).toMatch(/<MotionConfig\s+reducedMotion="user">/);

      const landingPath = path.resolve(__dirname, "../pages/Landing.tsx");
      const landingContent = fs.readFileSync(landingPath, "utf-8");
      expect(landingContent).toMatch(/<MotionConfig\s+reducedMotion="user">/);
    });

    it("STRESS 4.4: Rendering Sheet and TaskCard under prefers-reduced-motion matchMedia executes cleanly", () => {
      const restoreMedia = stubMatchMedia("(prefers-reduced-motion: reduce)");

      const testTask = makeTask({ title: "Reduced Motion Task", xp: 50 });
      render(
        <div>
          <Sheet open={true} title="Reduced Motion Sheet" onClose={() => {}}>
            <p>Sheet body</p>
          </Sheet>
          <TaskCard task={testTask} justCompleted={true} />
        </div>
      );

      expect(screen.getByRole("dialog", { name: "Reduced Motion Sheet" })).toBeInTheDocument();
      expect(screen.getByText("Reduced Motion Task")).toBeInTheDocument();

      restoreMedia();
    });

    it("STRESS 4.5: Completion celebration (burst and XP) is aria-hidden and does not trap or block user input", () => {
      const onCompleteMock = vi.fn();
      const testTask = makeTask({ title: "Celebration Task", xp: 100 });

      const { container } = render(
        <TaskCard
          task={testTask}
          justCompleted={true}
          onComplete={onCompleteMock}
          onEdit={() => {}}
        />
      );

      // Verify completion burst is present but marked aria-hidden
      const burst = container.querySelector(".completion-burst");
      expect(burst).not.toBeNull();
      expect(burst).toHaveAttribute("aria-hidden", "true");

      // Interactive edit button is still clickable and interactive
      const editBtn = screen.getByRole("button", { name: "Celebration Task" });
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).not.toBeDisabled();
    });
  });
});
