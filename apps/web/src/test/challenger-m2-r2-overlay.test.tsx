import React, { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet, Modal, ModalCloseButton } from "../ui";
import { CommandPalette } from "../views/CommandPalette";
import { dialogStack } from "../ui/dialogA11y";

describe("Challenger M2-R2-1: Empirical Stress Harness for Overlay Stack", () => {
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
    // Ensure clean dialogStack before each test
    dialogStack.length = 0;
  });

  describe("1. Deeply Nested Overlays (Sequential Stacking: Sheet -> Modal 1 -> Modal 2 -> CommandPalette)", () => {
    it("orderly LIFO unstacking across 4 distinct layers on sequential Escape presses", async () => {
      function Deep4LayerFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modal1Open, setModal1Open] = useState(false);
        const [modal2Open, setModal2Open] = useState(false);
        const [paletteOpen, setPaletteOpen] = useState(false);

        return (
          <div>
            <button data-testid="root-btn">Root Base</button>

            {/* Layer 1: Sheet */}
            <Sheet open={sheetOpen} title="Layer 1 Sheet" onClose={() => setSheetOpen(false)}>
              <input data-testid="sheet-input" placeholder="Sheet Input" />
              <button data-testid="open-modal-1-btn" onClick={() => setModal1Open(true)}>
                Open Modal 1
              </button>

              {/* Layer 2: Modal 1 */}
              {modal1Open && (
                <Modal title="Layer 2 Modal" onClose={() => setModal1Open(false)}>
                  <ModalCloseButton onClose={() => setModal1Open(false)} />
                  <input data-testid="modal-1-input" placeholder="Modal 1 Input" />
                  <button data-testid="open-modal-2-btn" onClick={() => setModal2Open(true)}>
                    Open Modal 2
                  </button>

                  {/* Layer 3: Modal 2 */}
                  {modal2Open && (
                    <Modal title="Layer 3 Modal" onClose={() => setModal2Open(false)}>
                      <ModalCloseButton onClose={() => setModal2Open(false)} />
                      <input data-testid="modal-2-input" placeholder="Modal 2 Input" />
                      <button data-testid="open-palette-btn" onClick={() => setPaletteOpen(true)}>
                        Open Palette
                      </button>
                    </Modal>
                  )}
                </Modal>
              )}
            </Sheet>

            {/* Layer 4: CommandPalette */}
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

      render(<Deep4LayerFixture />);

      // Step 1: Sheet is open
      expect(screen.getByText("Layer 1 Sheet")).toBeInTheDocument();

      // Step 2: Open Modal 1
      fireEvent.click(screen.getByTestId("open-modal-1-btn"));
      expect(screen.getByRole("dialog", { name: "Layer 2 Modal" })).toBeInTheDocument();

      // Step 3: Open Modal 2
      fireEvent.click(screen.getByTestId("open-modal-2-btn"));
      expect(screen.getByRole("dialog", { name: "Layer 3 Modal" })).toBeInTheDocument();

      // Step 4: Open CommandPalette
      fireEvent.click(screen.getByTestId("open-palette-btn"));
      expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();

      // All 4 layers are active!
      // Layer 4 = CommandPalette
      // Layer 3 = Modal 2
      // Layer 2 = Modal 1
      // Layer 1 = Sheet

      // Escape 1: Should close ONLY Layer 4 (CommandPalette)
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Layer 3 Modal" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Layer 2 Modal" })).toBeInTheDocument();
      expect(screen.getByText("Layer 1 Sheet")).toBeInTheDocument();

      // Escape 2: Should close ONLY Layer 3 (Modal 2)
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Layer 3 Modal" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Layer 2 Modal" })).toBeInTheDocument();
      expect(screen.getByText("Layer 1 Sheet")).toBeInTheDocument();

      // Escape 3: Should close ONLY Layer 2 (Modal 1)
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Layer 2 Modal" })).not.toBeInTheDocument();
      expect(screen.getByText("Layer 1 Sheet")).toBeInTheDocument();

      // Escape 4: Should close Layer 1 (Sheet)
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Layer 1 Sheet")).not.toBeInTheDocument();
    });

    it("focus trapping within topmost layer when layers are opened sequentially", async () => {
      function SequentialFocusFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modal1Open, setModal1Open] = useState(false);
        const [modal2Open, setModal2Open] = useState(false);

        return (
          <div>
            <Sheet open={sheetOpen} title="Layer 1 Sheet" onClose={() => setSheetOpen(false)}>
              <button data-testid="sheet-btn">Sheet Btn</button>
              <button data-testid="open-modal-1" onClick={() => setModal1Open(true)}>Open 1</button>

              {modal1Open && (
                <Modal title="Layer 2 Modal" onClose={() => setModal1Open(false)}>
                  <button data-testid="modal-1-btn">Modal 1 Btn</button>
                  <button data-testid="open-modal-2" onClick={() => setModal2Open(true)}>Open 2</button>

                  {modal2Open && (
                    <Modal title="Layer 3 Modal" onClose={() => setModal2Open(false)}>
                      <button data-testid="modal-2-btn-a">Modal 2 Action A</button>
                      <button data-testid="modal-2-btn-b">Modal 2 Action B</button>
                    </Modal>
                  )}
                </Modal>
              )}
            </Sheet>
          </div>
        );
      }

      render(<SequentialFocusFixture />);

      fireEvent.click(screen.getByTestId("open-modal-1"));
      fireEvent.click(screen.getByTestId("open-modal-2"));

      await new Promise((r) => setTimeout(r, 30));

      const btnA = screen.getByTestId("modal-2-btn-a");
      const btnB = screen.getByTestId("modal-2-btn-b");
      const sheetBtn = screen.getByTestId("sheet-btn");
      const modal1Btn = screen.getByTestId("modal-1-btn");

      // Focus on btnB (last element of top modal) and press Tab
      btnB.focus();
      expect(document.activeElement).toBe(btnB);

      fireEvent.keyDown(document, { key: "Tab" });

      // Focus MUST wrap to btnA in Layer 3 modal, NEVER leak to Layer 2 or Layer 1
      expect(document.activeElement).not.toBe(sheetBtn);
      expect(document.activeElement).not.toBe(modal1Btn);
      expect(document.activeElement).toBe(btnA);
    });
  });

  describe("2. Rapid Escape Presses (Sequential Opening)", () => {
    it("a single Escape event NEVER closes more than one dialog", () => {
      const sheetClose = vi.fn();
      const modal1Close = vi.fn();
      const modal2Close = vi.fn();

      function SequentialStackedListeners() {
        const [m1, setM1] = useState(false);
        const [m2, setM2] = useState(false);

        return (
          <Sheet open={true} title="Sheet" onClose={sheetClose}>
            <button data-testid="open-m1" onClick={() => setM1(true)}>Open M1</button>
            {m1 && (
              <Modal title="Modal 1" onClose={modal1Close}>
                <button data-testid="open-m2" onClick={() => setM2(true)}>Open M2</button>
                {m2 && (
                  <Modal title="Modal 2" onClose={modal2Close}>
                    <button>Innermost</button>
                  </Modal>
                )}
              </Modal>
            )}
          </Sheet>
        );
      }

      render(<SequentialStackedListeners />);
      fireEvent.click(screen.getByTestId("open-m1"));
      fireEvent.click(screen.getByTestId("open-m2"));

      // Fire a single Escape keydown
      fireEvent.keyDown(document, { key: "Escape" });

      // Exactly ONE dialog onClose should have fired (modal2Close)
      const totalCalls = sheetClose.mock.calls.length + modal1Close.mock.calls.length + modal2Close.mock.calls.length;
      expect(totalCalls).toBe(1);
      expect(modal2Close).toHaveBeenCalledTimes(1);
      expect(modal1Close).not.toHaveBeenCalled();
      expect(sheetClose).not.toHaveBeenCalled();
    });

    it("burst of rapid Escape keydowns with React state settling in between", () => {
      function SequentialBurstFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modal1Open, setModal1Open] = useState(false);
        const [modal2Open, setModal2Open] = useState(false);

        return (
          <div>
            {sheetOpen && (
              <Sheet open={true} title="Burst Sheet" onClose={() => setSheetOpen(false)}>
                <button data-testid="open-b1" onClick={() => setModal1Open(true)}>Open B1</button>
                {modal1Open && (
                  <Modal title="Burst Modal 1" onClose={() => setModal1Open(false)}>
                    <button data-testid="open-b2" onClick={() => setModal2Open(true)}>Open B2</button>
                    {modal2Open && (
                      <Modal title="Burst Modal 2" onClose={() => setModal2Open(false)}>
                        <button>Innermost</button>
                      </Modal>
                    )}
                  </Modal>
                )}
              </Sheet>
            )}
          </div>
        );
      }

      render(<SequentialBurstFixture />);
      fireEvent.click(screen.getByTestId("open-b1"));
      fireEvent.click(screen.getByTestId("open-b2"));

      expect(screen.getByRole("dialog", { name: "Burst Modal 2" })).toBeInTheDocument();

      // Rapidly fire 3 Escapes with React state settling in between
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(screen.queryByRole("dialog", { name: "Burst Modal 2" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Burst Modal 1" })).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(screen.queryByRole("dialog", { name: "Burst Modal 1" })).not.toBeInTheDocument();
      expect(screen.getByText("Burst Sheet")).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(screen.queryByText("Burst Sheet")).not.toBeInTheDocument();
    });

    it("rapid keydowns without waiting for React re-renders do not invoke background onClose callbacks", () => {
      const sheetClose = vi.fn();
      const modal1Close = vi.fn();
      const modal2Close = vi.fn();

      function StaticSequentialFixture() {
        const [m1, setM1] = useState(false);
        const [m2, setM2] = useState(false);

        return (
          <Sheet open={true} title="Static Sheet" onClose={sheetClose}>
            <button data-testid="open-m1" onClick={() => setM1(true)}>M1</button>
            {m1 && (
              <Modal title="Static Modal 1" onClose={modal1Close}>
                <button data-testid="open-m2" onClick={() => setM2(true)}>M2</button>
                {m2 && (
                  <Modal title="Static Modal 2" onClose={modal2Close}>
                    <button>Innermost</button>
                  </Modal>
                )}
              </Modal>
            )}
          </Sheet>
        );
      }

      render(<StaticSequentialFixture />);
      fireEvent.click(screen.getByTestId("open-m1"));
      fireEvent.click(screen.getByTestId("open-m2"));

      // Fire 5 rapid Escape keydowns without unmounting the top dialog
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(document, { key: "Escape" });
      }

      // Topmost (modal2) receives all 5 calls; background modals receive ZERO calls!
      expect(modal2Close).toHaveBeenCalledTimes(5);
      expect(modal1Close).toHaveBeenCalledTimes(0);
      expect(sheetClose).toHaveBeenCalledTimes(0);
    });
  });

  describe("3. DOM Detachment & Unmounting While Stacked (Sequential Opening)", () => {
    it("unmounting intermediate overlay (Modal 1) keeps Modal 2 topmost and cleans stack", () => {
      function IntermediateUnmountFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modal1Mounted, setModal1Mounted] = useState(false);
        const [modal2Open, setModal2Open] = useState(false);

        return (
          <div>
            <button data-testid="unmount-modal1-btn" onClick={() => setModal1Mounted(false)}>
              Drop Modal 1
            </button>
            <button data-testid="open-modal1" onClick={() => setModal1Mounted(true)}>
              Open Modal 1
            </button>
            <button data-testid="open-modal2" onClick={() => setModal2Open(true)}>
              Open Modal 2
            </button>

            {sheetOpen && (
              <Sheet open={true} title="Base Sheet" onClose={() => setSheetOpen(false)}>
                {modal1Mounted && (
                  <Modal title="Intermediate Modal 1" onClose={() => {}}>
                    <p>Intermediate content</p>
                  </Modal>
                )}
                {modal2Open && (
                  <Modal title="Top Modal 2" onClose={() => setModal2Open(false)}>
                    <button data-testid="modal2-btn">Modal 2 Action</button>
                  </Modal>
                )}
              </Sheet>
            )}
          </div>
        );
      }

      render(<IntermediateUnmountFixture />);
      fireEvent.click(screen.getByTestId("open-modal1"));
      fireEvent.click(screen.getByTestId("open-modal2"));

      expect(screen.getByRole("dialog", { name: "Intermediate Modal 1" })).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Top Modal 2" })).toBeInTheDocument();

      // Drop intermediate modal directly via parent state change (bypassing onClose)
      fireEvent.click(screen.getByTestId("unmount-modal1-btn"));
      expect(screen.queryByRole("dialog", { name: "Intermediate Modal 1" })).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Top Modal 2" })).toBeInTheDocument();

      // Press Escape: Top Modal 2 should close
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: "Top Modal 2" })).not.toBeInTheDocument();
      expect(screen.getByText("Base Sheet")).toBeInTheDocument();

      // Next Escape: Base Sheet should close
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Base Sheet")).not.toBeInTheDocument();
    });

    it("abrupt DOM detachment: removing topmost modal DOM node invokes purgeDisconnectedEntries", () => {
      const sheetClose = vi.fn();
      const modalClose = vi.fn();

      function DetachTopSequentialFixture() {
        const [modalOpen, setModalOpen] = useState(false);
        return (
          <Sheet open={true} title="Sheet To Test" onClose={sheetClose}>
            <button data-testid="open-modal" onClick={() => setModalOpen(true)}>Open</button>
            {modalOpen && (
              <Modal title="Orphan Modal" onClose={modalClose}>
                <button data-testid="orphan-btn">Orphan Action</button>
              </Modal>
            )}
          </Sheet>
        );
      }

      render(<DetachTopSequentialFixture />);
      fireEvent.click(screen.getByTestId("open-modal"));

      const orphanModal = screen.getByRole("dialog", { name: "Orphan Modal" });
      expect(orphanModal).toBeInTheDocument();

      // Simulate unexpected DOM detachment (e.g. animation engine removing node or third-party DOM mutation)
      orphanModal.remove();
      expect(document.contains(orphanModal)).toBe(false);

      // Now press Escape.
      // purgeDisconnectedEntries should purge the detached Orphan Modal from dialogStack,
      // promoting the underlying Sheet to topmost, allowing Sheet to handle Escape.
      fireEvent.keyDown(document, { key: "Escape" });

      expect(modalClose).not.toHaveBeenCalled();
      expect(sheetClose).toHaveBeenCalledTimes(1);
    });

    it("abrupt DOM detachment: removing intermediate modal DOM node preserves topmost overlay", () => {
      const sheetClose = vi.fn();
      const intermediateClose = vi.fn();
      const topClose = vi.fn();

      function DetachIntermediateSequentialFixture() {
        const [m1, setM1] = useState(false);
        const [m2, setM2] = useState(false);

        return (
          <Sheet open={true} title="Base Sheet" onClose={sheetClose}>
            <button data-testid="open-m1" onClick={() => setM1(true)}>M1</button>
            <button data-testid="open-m2" onClick={() => setM2(true)}>M2</button>
            {m1 && (
              <Modal title="Intermediate Modal" onClose={intermediateClose}>
                <p>Intermediate</p>
              </Modal>
            )}
            {m2 && (
              <Modal title="Topmost Modal" onClose={topClose}>
                <button>Top</button>
              </Modal>
            )}
          </Sheet>
        );
      }

      render(<DetachIntermediateSequentialFixture />);
      fireEvent.click(screen.getByTestId("open-m1"));
      fireEvent.click(screen.getByTestId("open-m2"));

      const intermediateEl = screen.getByRole("dialog", { name: "Intermediate Modal" });
      expect(intermediateEl).toBeInTheDocument();

      // Forcibly remove intermediate element from DOM
      intermediateEl.remove();

      // Press Escape: Topmost Modal should close
      fireEvent.keyDown(document, { key: "Escape" });
      expect(topClose).toHaveBeenCalledTimes(1);
      expect(intermediateClose).not.toHaveBeenCalled();
      expect(sheetClose).not.toHaveBeenCalled();
    });

    it("dialogStack is cleanly empty after closing all overlays", () => {
      function CleanStackFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(false);

        return (
          <div>
            {sheetOpen && (
              <Sheet open={true} title="Test Sheet" onClose={() => setSheetOpen(false)}>
                <button data-testid="open-modal" onClick={() => setModalOpen(true)}>Open</button>
                {modalOpen && (
                  <Modal title="Test Modal" onClose={() => setModalOpen(false)}>
                    <button>Inside</button>
                  </Modal>
                )}
              </Sheet>
            )}
          </div>
        );
      }

      render(<CleanStackFixture />);
      fireEvent.click(screen.getByTestId("open-modal"));

      // Both open: stack should have 2 entries
      expect(dialogStack.length).toBe(2);

      // Close modal
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(dialogStack.length).toBe(1);

      // Close sheet
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
      expect(dialogStack.length).toBe(0);
    });
  });

  describe("4. ADVERSARIAL STRESS TEST: Simultaneous Mount of Nested Overlays (Child Modal inside Sheet)", () => {
    it("BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock", () => {
      function SimultaneousNestedFixture() {
        const [sheetOpen, setSheetOpen] = useState(true);
        const [modalOpen, setModalOpen] = useState(true);

        return (
          <div>
            <Sheet open={sheetOpen} title="Parent Sheet" onClose={() => setSheetOpen(false)}>
              <button data-testid="sheet-action">Sheet Action</button>
              {modalOpen && (
                <Modal title="Nested Child Modal" onClose={() => setModalOpen(false)}>
                  <button data-testid="child-action">Child Action</button>
                </Modal>
              )}
            </Sheet>
          </div>
        );
      }

      render(<SimultaneousNestedFixture />);
      expect(screen.getByText("Parent Sheet")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Nested Child Modal" })).toBeInTheDocument();

      // 1st Escape: Closes Child Modal ONLY, Parent Sheet remains open
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog", { name: "Nested Child Modal" })).not.toBeInTheDocument();
      expect(screen.getByText("Parent Sheet")).toBeInTheDocument();

      // 2nd Escape: Closes Parent Sheet
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Parent Sheet")).not.toBeInTheDocument();
    });
  });
});
