import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { clearAllData, saveAppearanceSettings } from "../data/repositories";
import type { AppView } from "../shell/AppShell";

describe("Challenger M5-R3-1 Adversarial Stress Test: Keyboard Shortcuts & Input Isolation", () => {
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
    window.history.replaceState({}, "", "/app?view=dashboard");
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await clearAllData();
    // Clean up any stray DOM elements attached to body
    document.querySelectorAll("[data-test-fixture]").forEach((el) => el.remove());
  });

  // =========================================================================
  // 1. SHADOW DOM RETARGETING & ENCAPSULATION
  // =========================================================================
  describe("1. Shadow DOM Retargeting & Isolation", () => {
    it("CHALLENGE 1.1: Input inside an open ShadowRoot suppresses 'n' shortcut via composedPath and deep activeElement", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Create host element and attach shadow root
      const host = document.createElement("div");
      host.setAttribute("data-test-fixture", "shadow-host");
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      const shadowInput = document.createElement("input");
      shadowInput.type = "text";
      shadowInput.setAttribute("data-testid", "shadow-input");
      shadow.appendChild(shadowInput);

      shadowInput.focus();
      expect(document.activeElement).toBe(host);
      expect(shadow.activeElement).toBe(shadowInput);

      // Dispatch 'n' directly on shadow input with composed: true
      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, composed: true, cancelable: true });
      shadowInput.dispatchEvent(ev);

      expect(ev.defaultPrevented).toBe(false);
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 1.2: Textarea inside an open ShadowRoot suppresses 'n' shortcut", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const host = document.createElement("div");
      host.setAttribute("data-test-fixture", "shadow-textarea-host");
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      const shadowTextarea = document.createElement("textarea");
      shadow.appendChild(shadowTextarea);

      shadowTextarea.focus();
      expect(document.activeElement).toBe(host);
      expect(shadow.activeElement).toBe(shadowTextarea);

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, composed: true, cancelable: true });
      shadowTextarea.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 1.3: Contenteditable inside ShadowRoot suppresses 'n' shortcut", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const host = document.createElement("div");
      host.setAttribute("data-test-fixture", "shadow-editable-host");
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      const editable = document.createElement("div");
      editable.contentEditable = "true";
      editable.tabIndex = 0;
      shadow.appendChild(editable);

      editable.focus();
      expect(document.activeElement).toBe(host);
      expect(shadow.activeElement).toBe(editable);

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, composed: true, cancelable: true });
      editable.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 1.4: Nested ShadowRoot (2-tier deep) input suppresses 'n' shortcut", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Outer host -> Outer shadow -> Inner host -> Inner shadow -> Input
      const outerHost = document.createElement("div");
      outerHost.setAttribute("data-test-fixture", "outer-shadow-host");
      document.body.appendChild(outerHost);

      const outerShadow = outerHost.attachShadow({ mode: "open" });
      const innerHost = document.createElement("div");
      outerShadow.appendChild(innerHost);

      const innerShadow = innerHost.attachShadow({ mode: "open" });
      const deepInput = document.createElement("input");
      deepInput.type = "text";
      innerShadow.appendChild(deepInput);

      deepInput.focus();
      expect(document.activeElement).toBe(outerHost);
      expect(outerShadow.activeElement).toBe(innerHost);
      expect(innerShadow.activeElement).toBe(deepInput);

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, composed: true, cancelable: true });
      deepInput.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 1.5: Window-targeted keydown with focus inside ShadowRoot input suppresses 'n'", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const host = document.createElement("div");
      host.setAttribute("data-test-fixture", "shadow-window-host");
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      const shadowInput = document.createElement("input");
      shadow.appendChild(shadowInput);

      shadowInput.focus();

      // Keystroke dispatched on window directly while focus is deep inside shadow root
      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. WINDOW & DOCUMENT DISPATCH RESILIENCE
  // =========================================================================
  describe("2. Window and Document Event Dispatch Resilience", () => {
    it("CHALLENGE 2.1: Keystroke 'n' on window triggers task composer when body is focused", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      document.body.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "New task" })).toBeInTheDocument();
      });

      // Close it via Escape on document
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
      });
    });

    it("CHALLENGE 2.2: Keystroke 'n' on window is suppressed when an input is active", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const input = document.createElement("input");
      input.setAttribute("data-test-fixture", "standard-input");
      document.body.appendChild(input);
      input.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 2.3: Keystroke 'n' on document triggers task composer when body is focused", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      document.body.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      document.dispatchEvent(ev);

      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: "New task" })).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
      });
    });

    it("CHALLENGE 2.4: Non-element targets (document, window) in composedPath do not crash isTextEntryElement", () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      // Dispatch directly without crashing
      expect(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 3. CONTENTEDITABLE ELEMENT VARIATIONS
  // =========================================================================
  describe("3. Contenteditable Element Variations", () => {
    it("CHALLENGE 3.1: <div contenteditable=''> (empty string) suppresses 'n'", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const el = document.createElement("div");
      el.setAttribute("contenteditable", "");
      el.tabIndex = 0;
      el.setAttribute("data-test-fixture", "editable-empty-str");
      document.body.appendChild(el);
      el.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      el.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 3.2: Typing inside nested <span> within contenteditable suppresses 'n'", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const editor = document.createElement("div");
      editor.setAttribute("contenteditable", "true");
      editor.setAttribute("data-test-fixture", "nested-editor");
      const paragraph = document.createElement("p");
      const span = document.createElement("span");
      span.textContent = "rich text span";
      span.tabIndex = 0;
      paragraph.appendChild(span);
      editor.appendChild(paragraph);
      document.body.appendChild(editor);

      span.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      span.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    it("CHALLENGE 3.3: <div contenteditable='plaintext-only'> suppresses 'n'", async () => {
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      const el = document.createElement("div");
      el.setAttribute("contenteditable", "plaintext-only");
      el.tabIndex = 0;
      el.setAttribute("data-test-fixture", "plaintext-editor");
      document.body.appendChild(el);
      el.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      el.dispatchEvent(ev);

      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. 'N' SHORTCUT ACROSS ALL APPLICATION VIEWS
  // =========================================================================
  describe("4. 'N' Shortcut Behavior Across All Planner Views", () => {
    const plannerViews: AppView[] = ["dashboard", "kanban", "timeline", "goals", "courses"];

    for (const view of plannerViews) {
      it(`CHALLENGE 4.1-${view}: Pressing 'n' outside inputs in view='${view}' triggers task composer`, async () => {
        window.history.replaceState({}, "", `/app?view=${view}`);

        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        document.body.focus();

        const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
        window.dispatchEvent(ev);

        await waitFor(
          () => {
            expect(screen.getByRole("dialog", { name: "New task" })).toBeInTheDocument();
          },
          { timeout: 2000 }
        );

        fireEvent.keyDown(document, { key: "Escape" });
      });
    }

    it("CHALLENGE 4.2-notes: Pressing 'n' outside inputs in notes view creates a new note", async () => {
      window.history.replaceState({}, "", "/app?view=notes");

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      document.body.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      await waitFor(
        () => {
          expect(screen.getByLabelText("Note title")).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("CHALLENGE 4.3-insights: Empirical probe of 'n' shortcut in insights view", async () => {
      window.history.replaceState({}, "", "/app?view=insights");

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      document.body.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      // In insights view, primaryActionLabel is undefined, so 'n' currently does NOT open task composer
      // Let's empirically measure whether dialog opens
      const dialog = screen.queryByRole("dialog", { name: "New task" });
      expect(dialog).toBeNull();
    });

    it("CHALLENGE 4.4-settings: Empirical probe of 'n' shortcut in settings view", async () => {
      window.history.replaceState({}, "", "/app?view=settings");

      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      document.body.focus();

      const ev = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
      window.dispatchEvent(ev);

      // In settings view, primaryActionLabel is undefined, so 'n' currently does NOT open task composer
      const dialog = screen.queryByRole("dialog", { name: "New task" });
      expect(dialog).toBeNull();
    });
  });
});
