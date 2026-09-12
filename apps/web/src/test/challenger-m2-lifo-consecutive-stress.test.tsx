import React, { useState } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sheet, Modal, ConfirmDialog } from "../ui";
import { CommandPalette } from "../views/CommandPalette";

describe("Challenger M2-R2-2: Strict LIFO & Consecutive Escape Stress Tests", () => {
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

  it("STRESS 1: Stacked Modals (2 levels) close in strict LIFO order across consecutive Escapes", async () => {
    function StackedModals2() {
      const [modalAOpen, setModalAOpen] = useState(true);
      const [modalBOpen, setModalBOpen] = useState(false);

      return (
        <div>
          <button data-testid="page-trigger">Page Base</button>
          {modalAOpen && (
            <Modal title="Modal A" onClose={() => setModalAOpen(false)}>
              <button data-testid="open-modal-b" onClick={() => setModalBOpen(true)}>
                Open Modal B
              </button>
            </Modal>
          )}
          {modalBOpen && (
            <Modal title="Modal B" onClose={() => setModalBOpen(false)}>
              <button data-testid="modal-b-btn">Inside B</button>
            </Modal>
          )}
        </div>
      );
    }

    render(<StackedModals2 />);
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

    const openBBtn = screen.getByTestId("open-modal-b");
    openBBtn.focus();
    fireEvent.click(openBBtn);

    expect(screen.getByRole("dialog", { name: "Modal B" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

    // 1st Escape -> Closes ONLY Modal B
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Modal B" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

    // 2nd Escape -> Now closes Modal A
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Modal A" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal B" })).not.toBeInTheDocument();
  });

  it("STRESS 2: Stacked Modals (3 levels) close in strict LIFO order across 3 consecutive Escapes", async () => {
    function StackedModals3() {
      const [openA, setOpenA] = useState(true);
      const [openB, setOpenB] = useState(false);
      const [openC, setOpenC] = useState(false);

      return (
        <div>
          {openA && (
            <Modal title="Modal Level 1" onClose={() => setOpenA(false)}>
              <button data-testid="open-b" onClick={() => setOpenB(true)}>
                Open L2
              </button>
            </Modal>
          )}
          {openB && (
            <Modal title="Modal Level 2" onClose={() => setOpenB(false)}>
              <button data-testid="open-c" onClick={() => setOpenC(true)}>
                Open L3
              </button>
            </Modal>
          )}
          {openC && (
            <Modal title="Modal Level 3" onClose={() => setOpenC(false)}>
              <p>Deepest Child Level 3</p>
            </Modal>
          )}
        </div>
      );
    }

    render(<StackedModals3 />);
    expect(screen.getByRole("dialog", { name: "Modal Level 1" })).toBeInTheDocument();

    // Open L2
    fireEvent.click(screen.getByTestId("open-b"));
    expect(screen.getByRole("dialog", { name: "Modal Level 2" })).toBeInTheDocument();

    // Open L3
    fireEvent.click(screen.getByTestId("open-c"));
    expect(screen.getByRole("dialog", { name: "Modal Level 3" })).toBeInTheDocument();

    // All 3 modals are present
    expect(screen.getByRole("dialog", { name: "Modal Level 1" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal Level 2" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal Level 3" })).toBeInTheDocument();

    // Escape 1: Closes Level 3 only
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal Level 3" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal Level 2" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal Level 1" })).toBeInTheDocument();

    // Escape 2: Closes Level 2 only
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal Level 3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal Level 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal Level 1" })).toBeInTheDocument();

    // Escape 3: Closes Level 1
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal Level 3" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal Level 2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal Level 1" })).not.toBeInTheDocument();
  });

  it("STRESS 3: ConfirmDialog nested inside Sheet closes first, second Escape closes Sheet", async () => {
    function NestedSheetConfirm() {
      const [sheetOpen, setSheetOpen] = useState(true);
      const [confirmOpen, setConfirmOpen] = useState(false);

      return (
        <div>
          <button data-testid="page-anchor">Page Anchor</button>
          <Sheet open={sheetOpen} title="Editor Sheet" onClose={() => setSheetOpen(false)}>
            <input data-testid="sheet-input" placeholder="Title" />
            <button data-testid="trigger-confirm" onClick={() => setConfirmOpen(true)}>
              Delete
            </button>
            <ConfirmDialog
              open={confirmOpen}
              title="Confirm Action"
              message="Are you certain?"
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

    render(<NestedSheetConfirm />);
    expect(screen.getByText("Editor Sheet")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("trigger-confirm"));
    expect(screen.getByRole("dialog", { name: "Confirm Action" })).toBeInTheDocument();

    // 1st Escape -> Confirm closes, Sheet remains open
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Confirm Action" })).not.toBeInTheDocument();
    expect(screen.getByText("Editor Sheet")).toBeInTheDocument();

    // 2nd Escape -> Sheet closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Editor Sheet")).not.toBeInTheDocument();
  });

  it("STRESS 4: CommandPalette over Sheet closes first, second Escape closes Sheet", async () => {
    function PaletteOverSheet() {
      const [sheetOpen, setSheetOpen] = useState(true);
      const [paletteOpen, setPaletteOpen] = useState(false);

      return (
        <div>
          <Sheet open={sheetOpen} title="Background Sheet" onClose={() => setSheetOpen(false)}>
            <button data-testid="btn-in-sheet" onClick={() => setPaletteOpen(true)}>
              Open Palette
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

    render(<PaletteOverSheet />);
    expect(screen.getByText("Background Sheet")).toBeInTheDocument();

    // Open palette
    fireEvent.click(screen.getByTestId("btn-in-sheet"));
    expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();

    // 1st Escape -> Palette dismisses, Sheet stays open
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
    expect(screen.getByText("Background Sheet")).toBeInTheDocument();

    // 2nd Escape -> Sheet closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Background Sheet")).not.toBeInTheDocument();
  });

  it("STRESS 5: Triple stack with CommandPalette over Modal over Sheet", async () => {
    function TripleMixedStack() {
      const [sheetOpen, setSheetOpen] = useState(true);
      const [modalOpen, setModalOpen] = useState(false);
      const [paletteOpen, setPaletteOpen] = useState(false);

      return (
        <div>
          <Sheet open={sheetOpen} title="Root Sheet" onClose={() => setSheetOpen(false)}>
            <button data-testid="open-modal-from-sheet" onClick={() => setModalOpen(true)}>
              Open Modal
            </button>
          </Sheet>
          {modalOpen && (
            <Modal title="Middle Modal" onClose={() => setModalOpen(false)}>
              <button data-testid="open-palette-from-modal" onClick={() => setPaletteOpen(true)}>
                Open Palette
              </button>
            </Modal>
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

    render(<TripleMixedStack />);
    expect(screen.getByText("Root Sheet")).toBeInTheDocument();

    // Open Modal
    fireEvent.click(screen.getByTestId("open-modal-from-sheet"));
    expect(screen.getByRole("dialog", { name: "Middle Modal" })).toBeInTheDocument();

    // Open Palette
    fireEvent.click(screen.getByTestId("open-palette-from-modal"));
    expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();

    // Escape 1: CommandPalette closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Middle Modal" })).toBeInTheDocument();
    expect(screen.getByText("Root Sheet")).toBeInTheDocument();

    // Escape 2: Middle Modal closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Middle Modal" })).not.toBeInTheDocument();
    expect(screen.getByText("Root Sheet")).toBeInTheDocument();

    // Escape 3: Root Sheet closes
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Root Sheet")).not.toBeInTheDocument();
  });

  it("STRESS 6: Stack resilience when a middle dialog is unmounted without Escape", async () => {
    function StackWithProgrammaticDismissal() {
      const [openA, setOpenA] = useState(true);
      const [openB, setOpenB] = useState(true);
      const [openC, setOpenC] = useState(true);

      return (
        <div>
          {openA && (
            <Modal title="Modal A" onClose={() => setOpenA(false)}>
              <button data-testid="force-close-b" onClick={() => setOpenB(false)}>
                Kill B Programmatically
              </button>
            </Modal>
          )}
          {openB && (
            <Modal title="Modal B" onClose={() => setOpenB(false)}>
              <p>Middle B</p>
            </Modal>
          )}
          {openC && (
            <Modal title="Modal C" onClose={() => setOpenC(false)}>
              <p>Top C</p>
            </Modal>
          )}
        </div>
      );
    }

    render(<StackWithProgrammaticDismissal />);
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal B" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal C" })).toBeInTheDocument();

    // Programmatically unmount Modal B (the middle one)
    act(() => {
      fireEvent.click(screen.getByTestId("force-close-b"));
    });

    expect(screen.queryByRole("dialog", { name: "Modal B" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal C" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

    // Now press Escape -> Modal C (top) should close!
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal C" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal A" })).toBeInTheDocument();

    // Press Escape again -> Modal A should close!
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal A" })).not.toBeInTheDocument();
  });

  it("STRESS 7: Focus restoration chain across stacked modals", async () => {
    function FocusChainedModals() {
      const [open1, setOpen1] = useState(false);
      const [open2, setOpen2] = useState(false);

      return (
        <div>
          <button data-testid="base-trigger" onClick={() => setOpen1(true)}>
            Open 1
          </button>
          {open1 && (
            <Modal title="Modal 1" onClose={() => setOpen1(false)}>
              <button data-testid="sub-trigger" onClick={() => setOpen2(true)}>
                Open 2
              </button>
            </Modal>
          )}
          {open2 && (
            <Modal title="Modal 2" onClose={() => setOpen2(false)}>
              <button data-testid="inside-2">Leaf Button</button>
            </Modal>
          )}
        </div>
      );
    }

    render(<FocusChainedModals />);
    const baseTrigger = screen.getByTestId("base-trigger");
    baseTrigger.focus();
    expect(document.activeElement).toBe(baseTrigger);

    // Open Modal 1
    fireEvent.click(baseTrigger);
    expect(screen.getByRole("dialog", { name: "Modal 1" })).toBeInTheDocument();

    const subTrigger = screen.getByTestId("sub-trigger");
    subTrigger.focus();
    expect(document.activeElement).toBe(subTrigger);

    // Open Modal 2
    fireEvent.click(subTrigger);
    expect(screen.getByRole("dialog", { name: "Modal 2" })).toBeInTheDocument();

    // Escape Modal 2 -> Focus must restore to subTrigger!
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Modal 1" })).toBeInTheDocument();
    expect(document.activeElement).toBe(subTrigger);

    // Escape Modal 1 -> Focus must restore to baseTrigger!
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Modal 1" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(baseTrigger);
  });
});
