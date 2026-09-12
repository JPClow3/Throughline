import React, { useState } from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet, Modal, ModalCloseButton, ConfirmDialog } from "../ui";
import { CommandPalette } from "../views/CommandPalette";
import { dialogStack } from "../ui/dialogA11y";

describe("Challenger M2-R3-2: Focus Wrapping, Boundary Cycling & Overlay Inertness Under Simultaneous Mount", () => {
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
    // Ensure pristine dialogStack before each test
    dialogStack.length = 0;
  });

  // =========================================================================
  // 1. Tab Focus Wrapping During Simultaneous Mount
  // =========================================================================
  describe("1. Tab Focus Wrapping During Simultaneous Mount", () => {
    it("1.1 wraps forward from last focusable to first focusable in topmost modal without leaking to parent sheet", async () => {
      function SimultaneousSheetModal() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(true);

        return (
          <div>
            <button data-testid="page-btn">Page Background Button</button>
            <Sheet open={sheetOpen} title="Parent Sheet" onClose={() => setSheetOpen(false)}>
              <input data-testid="sheet-input" placeholder="Sheet Input" />
              <button data-testid="sheet-btn">Sheet Button</button>

              {modalOpen && (
                <Modal title="Child Modal" onClose={() => setModalOpen(false)}>
                  <ModalCloseButton onClose={() => setModalOpen(false)} />
                  <input data-testid="modal-input-1" placeholder="First Input" />
                  <select data-testid="modal-select">
                    <option value="1">Option 1</option>
                  </select>
                  <button data-testid="modal-btn-last">Last Button</button>
                </Modal>
              )}
            </Sheet>
          </div>
        );
      }

      render(<SimultaneousSheetModal />);

      // Both are in the DOM at the exact same time
      expect(screen.getByText("Parent Sheet")).toBeInTheDocument();
      const childModal = screen.getByRole("dialog", { name: "Child Modal" });
      expect(childModal).toBeInTheDocument();

      const modalCloseBtn = within(childModal).getByRole("button", { name: "Close" });
      const modalBtnLast = screen.getByTestId("modal-btn-last");
      const sheetInput = screen.getByTestId("sheet-input");
      const pageBtn = screen.getByTestId("page-btn");

      // Place focus on the last focusable element of the child modal
      modalBtnLast.focus();
      expect(document.activeElement).toBe(modalBtnLast);

      // Press Tab -> MUST wrap forward to first focusable element (modalCloseBtn)
      fireEvent.keyDown(document, { key: "Tab" });

      expect(document.activeElement).toBe(modalCloseBtn);
      expect(document.activeElement).not.toBe(sheetInput);
      expect(document.activeElement).not.toBe(pageBtn);
    });

    it("1.2 skips disabled, tabindex='-1', hidden, and aria-hidden elements when wrapping forward", () => {
      function ComplexFocusablesModal() {
        return (
          <Sheet open={true} title="Sheet Base" onClose={() => {}}>
            <button data-testid="sheet-btn">Sheet Action</button>
            <Modal title="Complex Filter Modal" onClose={() => {}}>
              <input data-testid="valid-first-input" placeholder="Valid First" />
              <button data-testid="disabled-btn" disabled>
                Disabled
              </button>
              <button data-testid="tabindex-minus-1-btn" tabIndex={-1}>
                Negative TabIndex
              </button>
              <button data-testid="aria-hidden-btn" aria-hidden="true">
                Aria Hidden
              </button>
              <input data-testid="hidden-input" type="hidden" />
              <textarea data-testid="valid-middle-textarea" defaultValue="Hello" />
              <a data-testid="anchor-no-href">Anchor Without Href</a>
              <a data-testid="valid-last-link" href="https://example.com">
                Valid Last Link
              </a>
            </Modal>
          </Sheet>
        );
      }

      render(<ComplexFocusablesModal />);

      const validFirst = screen.getByTestId("valid-first-input");
      const validLast = screen.getByTestId("valid-last-link");

      // Focus last valid element
      validLast.focus();
      expect(document.activeElement).toBe(validLast);

      // Press Tab -> wraps to first valid element
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(validFirst);
    });

    it("1.3 handles single focusable element in topmost overlay without leaking on Tab", () => {
      function SingleFocusableFixture() {
        return (
          <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
            <button data-testid="sheet-btn-1">Sheet Btn 1</button>
            <button data-testid="sheet-btn-2">Sheet Btn 2</button>
            <Modal title="Solo Modal" onClose={() => {}}>
              <button data-testid="solo-btn">Sole Button</button>
            </Modal>
          </Sheet>
        );
      }

      render(<SingleFocusableFixture />);

      const soloBtn = screen.getByTestId("solo-btn");
      const sheetBtn1 = screen.getByTestId("sheet-btn-1");

      soloBtn.focus();
      expect(document.activeElement).toBe(soloBtn);

      // Press Tab repeatedly
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(soloBtn);
      expect(document.activeElement).not.toBe(sheetBtn1);

      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(soloBtn);
    });

    it("1.4 handles zero focusable elements in topmost overlay by trapping focus on panel", async () => {
      function ZeroFocusableFixture() {
        return (
          <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
            <button data-testid="sheet-btn">Sheet Btn</button>
            <Modal title="Empty Content Modal" onClose={() => {}}>
              <p>Just plain static informative text without buttons or inputs</p>
            </Modal>
          </Sheet>
        );
      }

      render(<ZeroFocusableFixture />);

      const modalPanel = screen.getByRole("dialog", { name: "Empty Content Modal" });
      expect(modalPanel).toBeInTheDocument();

      // Fire Tab keydown
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true, bubbles: true });
      document.dispatchEvent(tabEvent);

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(modalPanel);
    });

    it("1.5 pulls external focus into topmost modal on forward Tab if focus was lost to background", () => {
      function LostFocusFixture() {
        return (
          <div>
            <button data-testid="outside-orphan">Orphan Outside</button>
            <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
              <button data-testid="sheet-element">Sheet Element</button>
              <Modal title="Target Modal" onClose={() => {}}>
                <button data-testid="target-first">Target First</button>
                <button data-testid="target-second">Target Second</button>
              </Modal>
            </Sheet>
          </div>
        );
      }

      render(<LostFocusFixture />);

      const outsideBtn = screen.getByTestId("outside-orphan");
      const targetFirst = screen.getByTestId("target-first");

      // Set focus outside the topmost modal
      outsideBtn.focus();
      expect(document.activeElement).toBe(outsideBtn);

      // Forward Tab -> topmost modal must intercept and pull focus to its first focusable
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(targetFirst);

      // Now set focus to parent sheet element
      const sheetElement = screen.getByTestId("sheet-element");
      sheetElement.focus();
      expect(document.activeElement).toBe(sheetElement);

      // Forward Tab -> pulls back to targetFirst
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(targetFirst);
    });
  });

  // =========================================================================
  // 2. Shift+Tab Boundary Cycling During Simultaneous Mount
  // =========================================================================
  describe("2. Shift+Tab Boundary Cycling During Simultaneous Mount", () => {
    it("2.1 wraps backward from first focusable to last focusable in topmost modal without leaking", () => {
      function SimultaneousShiftTabFixture() {
        return (
          <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
            <button data-testid="sheet-first">Sheet First</button>
            <Modal title="Child Modal Shift" onClose={() => {}}>
              <button data-testid="modal-first">Modal First</button>
              <input data-testid="modal-mid" placeholder="Modal Mid" />
              <button data-testid="modal-last">Modal Last</button>
            </Modal>
          </Sheet>
        );
      }

      render(<SimultaneousShiftTabFixture />);

      const modalFirst = screen.getByTestId("modal-first");
      const modalLast = screen.getByTestId("modal-last");
      const sheetFirst = screen.getByTestId("sheet-first");

      modalFirst.focus();
      expect(document.activeElement).toBe(modalFirst);

      // Press Shift+Tab -> MUST wrap backward to modalLast
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

      expect(document.activeElement).toBe(modalLast);
      expect(document.activeElement).not.toBe(sheetFirst);
    });

    it("2.2 smoothly cycles back and forth across 10 boundary traversals (Tab and Shift+Tab)", () => {
      function BoundaryOscillationFixture() {
        return (
          <Sheet open={true} title="Oscillation Sheet" onClose={() => {}}>
            <button data-testid="sheet-leak-check">Sheet Button</button>
            <Modal title="Oscillation Modal" onClose={() => {}}>
              <button data-testid="osc-first">Boundary A (First)</button>
              <button data-testid="osc-last">Boundary B (Last)</button>
            </Modal>
          </Sheet>
        );
      }

      render(<BoundaryOscillationFixture />);

      const oscFirst = screen.getByTestId("osc-first");
      const oscLast = screen.getByTestId("osc-last");
      const sheetLeakCheck = screen.getByTestId("sheet-leak-check");

      // Start at first
      oscFirst.focus();
      expect(document.activeElement).toBe(oscFirst);

      for (let cycle = 0; cycle < 5; cycle++) {
        // Shift+Tab -> wraps to last
        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
        expect(document.activeElement).toBe(oscLast);
        expect(document.activeElement).not.toBe(sheetLeakCheck);

        // Tab -> wraps to first
        fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
        expect(document.activeElement).toBe(oscFirst);
        expect(document.activeElement).not.toBe(sheetLeakCheck);
      }
    });

    it("2.3 handles single focusable element in topmost overlay on Shift+Tab", () => {
      function SingleFocusableShiftFixture() {
        return (
          <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
            <button data-testid="sheet-btn">Sheet Action</button>
            <Modal title="Single Child Modal" onClose={() => {}}>
              <button data-testid="only-btn">Only Action</button>
            </Modal>
          </Sheet>
        );
      }

      render(<SingleFocusableShiftFixture />);

      const onlyBtn = screen.getByTestId("only-btn");
      onlyBtn.focus();
      expect(document.activeElement).toBe(onlyBtn);

      // Press Shift+Tab -> remains on onlyBtn
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(onlyBtn);
    });

    it("2.4 pulls external focus to topmost modal's LAST focusable on Shift+Tab if focus was lost", () => {
      function OutsideLostShiftFixture() {
        return (
          <div>
            <button data-testid="lost-btn">Lost Out</button>
            <Sheet open={true} title="Base Sheet" onClose={() => {}}>
              <Modal title="Pull Target" onClose={() => {}}>
                <button data-testid="pull-first">First</button>
                <button data-testid="pull-last">Last</button>
              </Modal>
            </Sheet>
          </div>
        );
      }

      render(<OutsideLostShiftFixture />);

      const lostBtn = screen.getByTestId("lost-btn");
      const pullLast = screen.getByTestId("pull-last");

      lostBtn.focus();
      expect(document.activeElement).toBe(lostBtn);

      // Press Shift+Tab while focus is outside -> pulls to LAST element of topmost modal
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(pullLast);
    });
  });

  // =========================================================================
  // 3. Non-Topmost Overlay Inertness During Simultaneous Mount
  // =========================================================================
  describe("3. Non-Topmost Overlay Inertness During Simultaneous Mount", () => {
    it("3.1 parent Sheet is completely inert to Escape when Child Modal is mounted simultaneously", () => {
      const sheetClose = vi.fn();
      const modalClose = vi.fn();

      function Simultaneous2Level() {
        return (
          <Sheet open={true} title="Inert Parent Sheet" onClose={sheetClose}>
            <button data-testid="sheet-action">Sheet Action</button>
            <Modal title="Active Child Modal" onClose={modalClose}>
              <button data-testid="child-action">Child Action</button>
            </Modal>
          </Sheet>
        );
      }

      render(<Simultaneous2Level />);

      // Fire Escape keydown
      fireEvent.keyDown(document, { key: "Escape" });

      // Child Modal handles Escape; Parent Sheet is completely inert
      expect(modalClose).toHaveBeenCalledTimes(1);
      expect(sheetClose).not.toHaveBeenCalled();
    });

    it("3.2 parent Sheet's Tab key listener is completely inert while Child Modal is mounted", () => {
      function SheetTrapInertness() {
        return (
          <Sheet open={true} title="Parent Sheet" onClose={() => {}}>
            <button data-testid="sheet-btn-1">Sheet Btn 1</button>
            <button data-testid="sheet-btn-2">Sheet Btn 2</button>
            <Modal title="Child Modal" onClose={() => {}}>
              <button data-testid="child-btn-1">Child Btn 1</button>
              <button data-testid="child-btn-2">Child Btn 2</button>
            </Modal>
          </Sheet>
        );
      }

      render(<SheetTrapInertness />);

      const childBtn2 = screen.getByTestId("child-btn-2");
      const childBtn1 = screen.getByTestId("child-btn-1");
      const sheetBtn1 = screen.getByTestId("sheet-btn-1");

      childBtn2.focus();
      expect(document.activeElement).toBe(childBtn2);

      // Fire Tab -> child modal wraps to childBtn1.
      // Parent Sheet must NOT attempt to re-focus sheetBtn1!
      fireEvent.keyDown(document, { key: "Tab" });

      expect(document.activeElement).toBe(childBtn1);
      expect(document.activeElement).not.toBe(sheetBtn1);
    });

    it("3.3 triple simultaneous nesting (Sheet + Modal 1 + Modal 2): only grandchild is active, others inert", () => {
      const sheetClose = vi.fn();
      const modal1Close = vi.fn();
      const modal2Close = vi.fn();

      function TripleSimultaneousFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [m1Open, setM1Open] = useState(true);
        const [m2Open, setM2Open] = useState(true);

        return (
          <div>
            {sheetOpen && (
              <Sheet
                open={true}
                title="Root Sheet L1"
                onClose={() => {
                  sheetClose();
                  setSheetOpen(false);
                }}
              >
                <button data-testid="sheet-l1-btn">L1 Action</button>
                {m1Open && (
                  <Modal
                    title="Modal L2"
                    onClose={() => {
                      modal1Close();
                      setM1Open(false);
                    }}
                  >
                    <button data-testid="modal-l2-btn">L2 Action</button>
                    {m2Open && (
                      <Modal
                        title="Grandchild Modal L3"
                        onClose={() => {
                          modal2Close();
                          setM2Open(false);
                        }}
                      >
                        <button data-testid="l3-first">L3 First</button>
                        <button data-testid="l3-last">L3 Last</button>
                      </Modal>
                    )}
                  </Modal>
                )}
              </Sheet>
            )}
          </div>
        );
      }

      render(<TripleSimultaneousFixture />);

      expect(screen.getByText("Root Sheet L1")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Modal L2" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Grandchild Modal L3" })).toBeInTheDocument();

      const l3First = screen.getByTestId("l3-first");
      const l3Last = screen.getByTestId("l3-last");

      // Verify L3 has active Tab focus wrapping
      l3Last.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(l3First);

      // Verify L3 has active Shift+Tab boundary cycling
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(l3Last);

      // Escape 1: Should close ONLY L3 (Grandchild Modal)
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(modal2Close).toHaveBeenCalledTimes(1);
      expect(modal1Close).not.toHaveBeenCalled();
      expect(sheetClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Grandchild Modal L3" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Modal L2" })).toBeInTheDocument();

      // Now Modal L2 must become the topmost active overlay, while Root Sheet remains inert
      const l2Btn = screen.getByTestId("modal-l2-btn");
      l2Btn.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(l2Btn); // Single focusable in L2

      // Escape 2: Should close ONLY L2 (Modal 1)
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(modal1Close).toHaveBeenCalledTimes(1);
      expect(sheetClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Modal L2" })).not.toBeInTheDocument();
      expect(screen.getByText("Root Sheet L1")).toBeInTheDocument();

      // Now Root Sheet becomes topmost
      const sheetCloseBtn = within(screen.getByRole("dialog", { name: "Root Sheet L1" })).getByRole("button", {
        name: "Close"
      });
      const sheetL1Btn = screen.getByTestId("sheet-l1-btn");

      sheetL1Btn.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(sheetCloseBtn);

      // Escape 3: Closes Root Sheet
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(sheetClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Root Sheet L1")).not.toBeInTheDocument();
    });

    it("3.4 simultaneous sibling modals inside Sheet: last mounted sibling is topmost, first is inert", () => {
      const sheetClose = vi.fn();
      const modalAClose = vi.fn();
      const modalBClose = vi.fn();

      function SimultaneousSiblingsFixture() {
        const [mBOpen, setMBOpen] = useState(true);
        const [mAOpen, setMAOpen] = useState(true);
        const [sheetOpen, setSheetOpen] = useState(true);

        return (
          <div>
            {sheetOpen && (
              <Sheet
                open={true}
                title="Sibling Sheet"
                onClose={() => {
                  sheetClose();
                  setSheetOpen(false);
                }}
              >
                {mAOpen && (
                  <Modal
                    title="Modal Sibling A"
                    onClose={() => {
                      modalAClose();
                      setMAOpen(false);
                    }}
                  >
                    <button data-testid="sibling-a-btn">Action A</button>
                  </Modal>
                )}
                {mBOpen && (
                  <Modal
                    title="Modal Sibling B"
                    onClose={() => {
                      modalBClose();
                      setMBOpen(false);
                    }}
                  >
                    <button data-testid="sibling-b-btn">Action B</button>
                  </Modal>
                )}
              </Sheet>
            )}
          </div>
        );
      }

      render(<SimultaneousSiblingsFixture />);

      // Both siblings and sheet are present
      expect(screen.getByRole("dialog", { name: "Modal Sibling A" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Modal Sibling B" })).toBeInTheDocument();

      // Escape 1: Closes Sibling B (last registered candidate)
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(modalBClose).toHaveBeenCalledTimes(1);
      expect(modalAClose).not.toHaveBeenCalled();
      expect(sheetClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Modal Sibling B" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Modal Sibling A" })).toBeInTheDocument();

      // Escape 2: Closes Sibling A
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(modalAClose).toHaveBeenCalledTimes(1);
      expect(sheetClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Modal Sibling A" })).not.toBeInTheDocument();
      expect(screen.getByText("Sibling Sheet")).toBeInTheDocument();

      // Escape 3: Closes Sheet
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(sheetClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Sibling Sheet")).not.toBeInTheDocument();
    });

    it("3.5 ConfirmDialog inside Sheet during simultaneous mount: ConfirmDialog is active topmost, Sheet is inert", () => {
      const sheetClose = vi.fn();
      const confirmCancel = vi.fn();
      const confirmOk = vi.fn();

      function ConfirmInsideSheetFixture() {
        const [confirmOpen, setConfirmOpen] = useState(true);
        const [sheetOpen, setSheetOpen] = useState(true);

        return (
          <div>
            {sheetOpen && (
              <Sheet
                open={true}
                title="Editor Sheet"
                onClose={() => {
                  sheetClose();
                  setSheetOpen(false);
                }}
              >
                <input data-testid="editor-title" defaultValue="Unsaved task" />
                <ConfirmDialog
                  open={confirmOpen}
                  title="Discard changes?"
                  message="Are you sure you want to discard unsaved edits?"
                  confirmLabel="Discard"
                  cancelLabel="Keep Editing"
                  onConfirm={() => {
                    confirmOk();
                    setConfirmOpen(false);
                  }}
                  onCancel={() => {
                    confirmCancel();
                    setConfirmOpen(false);
                  }}
                />
              </Sheet>
            )}
          </div>
        );
      }

      render(<ConfirmInsideSheetFixture />);

      expect(screen.getByRole("dialog", { name: "Discard changes?" })).toBeInTheDocument();
      expect(screen.getByText("Editor Sheet")).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: "Keep Editing" });
      const discardBtn = screen.getByRole("button", { name: "Discard" });

      // Tab focus wrapping inside ConfirmDialog
      discardBtn.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(cancelBtn);

      // Shift+Tab boundary cycling inside ConfirmDialog
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(discardBtn);

      // Press Escape -> Closes ConfirmDialog (cancel), Sheet remains open and untouched
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(confirmCancel).toHaveBeenCalledTimes(1);
      expect(sheetClose).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Discard changes?" })).not.toBeInTheDocument();
      expect(screen.getByText("Editor Sheet")).toBeInTheDocument();

      // Now Sheet is topmost
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(sheetClose).toHaveBeenCalledTimes(1);
    });

    it("3.6 CommandPalette takes precedence over simultaneously mounted Sheet and Modal", () => {
      const sheetClose = vi.fn();
      const modalClose = vi.fn();

      function PrecedencePaletteFixture() {
        const [paletteOpen, setPaletteOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(true);
        const [sheetOpen, setSheetOpen] = useState(true);

        return (
          <div>
            {sheetOpen && (
              <Sheet
                open={true}
                title="Background Sheet"
                onClose={() => {
                  sheetClose();
                  setSheetOpen(false);
                }}
              >
                {modalOpen && (
                  <Modal
                    title="Background Modal"
                    onClose={() => {
                      modalClose();
                      setModalOpen(false);
                    }}
                  >
                    <button data-testid="inside-modal-btn">Inside Modal</button>
                  </Modal>
                )}
              </Sheet>
            )}
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

      render(<PrecedencePaletteFixture />);

      // Palette is open; Sheet and Modal exist in DOM (inside aria-hidden portal ancestor while cmdk is active)
      expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();
      expect(screen.getByTestId("inside-modal-btn")).toBeInTheDocument();
      expect(screen.getByText("Background Sheet")).toBeInTheDocument();

      // Escape 1: Palette closes. Sheet and Modal receive 0 close calls!
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
      expect(modalClose).not.toHaveBeenCalled();
      expect(sheetClose).not.toHaveBeenCalled();

      // Now Modal is accessible as topmost dialog
      expect(screen.getByRole("dialog", { name: "Background Modal" })).toBeInTheDocument();

      // Escape 2: Modal closes. Sheet receives 0 calls!
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(modalClose).toHaveBeenCalledTimes(1);
      expect(sheetClose).not.toHaveBeenCalled();

      // Escape 3: Sheet closes
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(sheetClose).toHaveBeenCalledTimes(1);
    });

    it("3.7 abrupt DOM removal of topmost modal during simultaneous mount immediately promotes Sheet to topmost", () => {
      const sheetClose = vi.fn();
      const modalClose = vi.fn();

      function DetachTopSimultaneousFixture() {
        return (
          <Sheet open={true} title="Sheet To Promote" onClose={sheetClose}>
            <button data-testid="sheet-target-btn">Sheet Target</button>
            <Modal title="Detachable Modal" onClose={modalClose}>
              <button data-testid="detachable-btn">Modal Target</button>
            </Modal>
          </Sheet>
        );
      }

      render(<DetachTopSimultaneousFixture />);

      const modalEl = screen.getByRole("dialog", { name: "Detachable Modal" });
      expect(modalEl).toBeInTheDocument();

      // Abruptly detach modal DOM node without React unmount
      modalEl.remove();
      expect(document.contains(modalEl)).toBe(false);

      // Now press Tab
      // Topmost overlay check will purge disconnected modal, promoting Sheet to topmost
      const sheetCloseBtn = within(screen.getByRole("dialog", { name: "Sheet To Promote" })).getByRole("button", {
        name: "Close"
      });
      const sheetTargetBtn = screen.getByTestId("sheet-target-btn");

      sheetTargetBtn.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(sheetCloseBtn);

      // Press Escape -> Sheet closes, modalClose is not called
      fireEvent.keyDown(document, { key: "Escape" });
      expect(modalClose).not.toHaveBeenCalled();
      expect(sheetClose).toHaveBeenCalledTimes(1);
    });

    it("3.8 rapid Escape burst (10 keydowns) invokes only topmost modal without double-triggering inert Sheet", () => {
      const sheetClose = vi.fn();
      const modalClose = vi.fn();

      function RapidBurstSimultaneous() {
        return (
          <Sheet open={true} title="Inert Sheet Under Burst" onClose={sheetClose}>
            <Modal title="Topmost Under Burst" onClose={modalClose}>
              <button>Top Content</button>
            </Modal>
          </Sheet>
        );
      }

      render(<RapidBurstSimultaneous />);

      // Rapidly fire 10 Escape keydowns synchronously
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: "Escape" });
      }

      // Topmost receives all 10 calls; parent Sheet receives 0 calls
      expect(modalClose).toHaveBeenCalledTimes(10);
      expect(sheetClose).toHaveBeenCalledTimes(0);
    });
  });
});
