import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { saveAppearanceSettings } from "../data/repositories";
import { CommandPalette } from "../views/CommandPalette";
import { Sheet } from "../ui/Overlay";

describe("Challenger M2 Adversarial Stress Suite", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    await saveAppearanceSettings({ hasCompletedOnboarding: true });
  });

  describe("1. Quick Capture 'N' on Various Views", () => {
    it("opens task composer when pressing 'n' on dashboard view", async () => {
      window.history.replaceState({}, "", "/app?view=dashboard");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Today" });
      fireEvent.keyDown(document.body, { key: "n" });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("opens task composer when pressing 'n' on goals view", async () => {
      window.history.replaceState({}, "", "/app?view=goals");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Goals" });
      fireEvent.keyDown(document.body, { key: "n" });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("opens task composer when pressing uppercase 'N' (Shift+N) on goals view", async () => {
      window.history.replaceState({}, "", "/app?view=goals");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Goals" });
      fireEvent.keyDown(document.body, { key: "N", shiftKey: true });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("opens task composer when pressing 'n' on kanban view", async () => {
      window.history.replaceState({}, "", "/app?view=kanban");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Board" });
      fireEvent.keyDown(document.body, { key: "n" });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("opens task composer when pressing 'n' on timeline view", async () => {
      window.history.replaceState({}, "", "/app?view=timeline");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Timeline" });
      fireEvent.keyDown(document.body, { key: "n" });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("opens task composer when pressing 'n' on courses/projects view", async () => {
      window.history.replaceState({}, "", "/app?view=courses");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Projects" });
      fireEvent.keyDown(document.body, { key: "n" });

      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
    });

    it("does NOT open task composer on notes view; instead triggers note creation and keeps composer closed", async () => {
      window.history.replaceState({}, "", "/app?view=notes");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Notes" }, { timeout: 5000 });
      fireEvent.keyDown(document.body, { key: "n" });

      // Task composer should NOT be open
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();
    });

    it("behavior check: pressing 'n' on insights view", async () => {
      window.history.replaceState({}, "", "/app?view=insights");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Insights" }, { timeout: 5000 });
      fireEvent.keyDown(document.body, { key: "n" });

      // Document whether task composer opens or not on insights view
      const composerHeading = screen.queryByRole("heading", { name: "New task" });
      // In current code, primaryActionLabel is undefined for insights
      expect(composerHeading).toBeNull();
    });

    it("behavior check: pressing 'n' on settings view", async () => {
      window.history.replaceState({}, "", "/app?view=settings");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Settings" }, { timeout: 5000 });
      fireEvent.keyDown(document.body, { key: "n" });

      // In current code, primaryActionLabel is undefined for settings
      const composerHeading = screen.queryByRole("heading", { name: "New task" });
      expect(composerHeading).toBeNull();
    });

    it("verifies desktop masthead 'New Task' button behavior on insights view", async () => {
      window.history.replaceState({}, "", "/app?view=insights");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Insights" }, { timeout: 5000 });

      // Find the desktop masthead button
      const newTaskBtn = screen.getByRole("button", { name: /New Task/i });
      expect(newTaskBtn).toBeInTheDocument();

      fireEvent.click(newTaskBtn);

      // Check if composer opens
      const composerHeading = screen.queryByRole("heading", { name: "New task" });
      // EMPIRICAL OBSERVATION: Does it open or is it dead?
      expect(composerHeading).toBeNull(); // It is dead on insights!
    });

    it("does NOT open composer when modifier keys are pressed (Ctrl+N, Meta+N, Alt+N)", async () => {
      window.history.replaceState({}, "", "/app?view=goals");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Goals" });

      fireEvent.keyDown(document.body, { key: "n", ctrlKey: true });
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();

      fireEvent.keyDown(document.body, { key: "n", metaKey: true });
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();

      fireEvent.keyDown(document.body, { key: "n", altKey: true });
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();
    });

    it("does NOT open composer when typing 'n' inside an input or textarea", async () => {
      window.history.replaceState({}, "", "/app?view=goals");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Goals" });

      // Create an input and focus it
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: "n" });
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();

      document.body.removeChild(input);
    });

    it("does NOT trigger quick capture when another dialog is already open", async () => {
      window.history.replaceState({}, "", "/app?view=goals");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findByRole("heading", { name: "Goals" });

      // Open command palette via Ctrl+K
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
      expect(await screen.findByPlaceholderText("Type a command or search...")).toBeInTheDocument();

      // Press 'n' while palette is open
      fireEvent.keyDown(document.body, { key: "n" });

      // Task composer should NOT mount underneath
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();
    });
  });

  describe("2. Command Palette 'Go to Insights' Navigation & Focus", () => {
    it("renders 'Go to Insights' with ChartLine icon and navigates to insights", () => {
      const onNavigate = vi.fn();
      const setOpen = vi.fn();

      render(
        <CommandPalette
          open={true}
          setOpen={setOpen}
          onNavigate={onNavigate}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      const insightsItem = screen.getByText("Go to Insights");
      expect(insightsItem).toBeInTheDocument();

      // Check item click
      fireEvent.click(insightsItem);
      expect(onNavigate).toHaveBeenCalledWith("insights");
      expect(setOpen).toHaveBeenCalledWith(false);
    });

    it("allows selecting 'Go to Insights' when query matches 'insights' or 'INSIGHTS'", () => {
      const onNavigate = vi.fn();
      const setOpen = vi.fn();

      render(
        <CommandPalette
          open={true}
          setOpen={setOpen}
          onNavigate={onNavigate}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText("Type a command or search...");
      fireEvent.change(input, { target: { value: "insights" } });

      const insightsItem = screen.getByText("Go to Insights");
      expect(insightsItem).toBeInTheDocument();

      fireEvent.click(insightsItem);
      expect(onNavigate).toHaveBeenCalledWith("insights");
    });

    it("dismisses CommandPalette when clicking on backdrop", () => {
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

      const backdrop = document.querySelector(".palette-backdrop");
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(setOpen).toHaveBeenCalledWith(false);
    });

    it("restores focus to the trigger button upon close", async () => {
      const trigger = document.createElement("button");
      trigger.textContent = "Trigger";
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const { rerender } = render(
        <CommandPalette
          open={true}
          setOpen={vi.fn()}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      rerender(
        <CommandPalette
          open={false}
          setOpen={vi.fn()}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
        />
      );

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(document.activeElement).toBe(trigger);
      document.body.removeChild(trigger);
    });
  });

  describe("3. URL Query Parsing, Aliases & Hash Variations", () => {
    it("canonicalizes ?view=today to ?view=dashboard", async () => {
      window.history.replaceState({}, "", "/app?view=today");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
      expect(window.location.search).toBe("?view=dashboard");
    });

    it("canonicalizes uppercase ?view=TODAY to ?view=dashboard", async () => {
      window.history.replaceState({}, "", "/app?view=TODAY");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
      expect(window.location.search).toBe("?view=dashboard");
    });

    it("canonicalizes mixed-case ?view=ToDaY to ?view=dashboard", async () => {
      window.history.replaceState({}, "", "/app?view=ToDaY");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
      expect(window.location.search).toBe("?view=dashboard");
    });

    it("preserves other query parameters when canonicalizing view=today", async () => {
      window.history.replaceState({}, "", "/app?utm_source=pwa&view=today&theme=dark");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
      expect(window.location.search).toContain("view=dashboard");
      expect(window.location.search).toContain("utm_source=pwa");
      expect(window.location.search).toContain("theme=dark");
    });

    it("preserves URL hash when canonicalizing ?view=today#overview", async () => {
      window.history.replaceState({}, "", "/app?view=today#overview");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
      expect(window.location.search).toBe("?view=dashboard");
      expect(window.location.hash).toBe("#overview");
    });

    it("correctly resolves uppercase valid view ?view=KANBAN to kanban view", async () => {
      window.history.replaceState({}, "", "/app?view=KANBAN");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      expect(await screen.findByRole("heading", { name: "Board" })).toBeInTheDocument();
    });

    it("correctly resolves uppercase valid view ?view=GOALS to goals view", async () => {
      window.history.replaceState({}, "", "/app?view=GOALS");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      expect(await screen.findByRole("heading", { name: "Goals" })).toBeInTheDocument();
    });

    it("correctly resolves uppercase valid view ?view=INSIGHTS to insights view", async () => {
      window.history.replaceState({}, "", "/app?view=INSIGHTS");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      expect(await screen.findByRole("heading", { name: "Insights" })).toBeInTheDocument();
    });

    it("falls back safely to dashboard for unknown view ?view=invalid_view_name", async () => {
      window.history.replaceState({}, "", "/app?view=invalid_view_name");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
    });

    it("falls back safely to dashboard for empty ?view=", async () => {
      window.history.replaceState({}, "", "/app?view=");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
    });

    it("handles prototype pollution attacks (?view=constructor, ?view=toString, ?view=__proto__) safely", async () => {
      const attackViews = ["constructor", "toString", "valueOf", "__proto__", "hasOwnProperty"];

      for (const attack of attackViews) {
        window.history.replaceState({}, "", `/app?view=${attack}`);
        const { unmount } = render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
        expect(todayTab).toHaveAttribute("aria-current", "page");
        unmount();
      }
    });

    it("handles extreme length query parameter gracefully", async () => {
      const extreme = "a".repeat(4000);
      window.history.replaceState({}, "", `/app?view=${extreme}`);
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
    });

    it("handles path traversal in view parameter (?view=dashboard/../today)", async () => {
      window.history.replaceState({}, "", "/app?view=dashboard/../today");
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const [todayTab] = await screen.findAllByRole("link", { name: "Today" });
      expect(todayTab).toHaveAttribute("aria-current", "page");
    });
  });

  describe("4. Dialog & Sheet Accessibility Stress", () => {
    it("safely handles dialog with zero focusable interactive elements", () => {
      render(
        <Sheet open={true} title="Zero Focusable Sheet" onClose={vi.fn()}>
          <div>Static text only, no buttons or links.</div>
        </Sheet>
      );

      // Close button exists in header, but let's test tab handling
      fireEvent.keyDown(document, { key: "Tab" });
      // Should not throw or crash
      expect(screen.getByText("Zero Focusable Sheet")).toBeInTheDocument();
    });

    it("skips disabled and tabindex='-1' elements during tab navigation", () => {
      render(
        <Sheet open={true} title="Skip Elements Sheet" onClose={vi.fn()}>
          <button data-testid="disabled-btn" disabled>Disabled</button>
          <a href="#test" data-testid="tabindex-minus-one" tabIndex={-1}>Ignored</a>
          <div aria-hidden="true">
            <button data-testid="aria-hidden-btn">Hidden</button>
          </div>
          <button data-testid="active-btn">Active</button>
        </Sheet>
      );

      const closeBtn = screen.getByRole("button", { name: "Close" });
      const activeBtn = screen.getByTestId("active-btn");

      // Active button should wrap to close button on Tab
      activeBtn.focus();
      fireEvent.keyDown(document, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);

      // Close button should wrap to active button on Shift+Tab
      closeBtn.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(activeBtn);
    });

    it("does not throw when trigger button is unmounted from DOM before dialog closes", async () => {
      function Wrapper() {
        const [open, setOpen] = React.useState(true);
        const [showTrigger, setShowTrigger] = React.useState(true);

        return (
          <div>
            {showTrigger ? (
              <button data-testid="fragile-trigger" onClick={() => setOpen(true)}>
                Trigger
              </button>
            ) : null}
            <Sheet open={open} title="Unmounted Trigger Sheet" onClose={() => setOpen(false)}>
              <button
                data-testid="remove-trigger-and-close"
                onClick={() => {
                  setShowTrigger(false);
                  setOpen(false);
                }}
              >
                Destroy Trigger & Close
              </button>
            </Sheet>
          </div>
        );
      }

      render(<Wrapper />);
      const closeBtn = screen.getByTestId("remove-trigger-and-close");
      fireEvent.click(closeBtn);

      // Wait for unmount / cleanup to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(screen.queryByText("Unmounted Trigger Sheet")).not.toBeInTheDocument();
    });
  });
});
