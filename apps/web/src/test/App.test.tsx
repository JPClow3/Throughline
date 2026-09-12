import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { saveAppearanceSettings } from "../data/repositories";

describe("App", () => {
  it("renders the planner shell", async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    const todayButtons = await screen.findAllByRole("link", { name: "Today" });
    expect(todayButtons.length).toBeGreaterThan(0);
    const boardButtons = screen.getAllByLabelText("Board");
    expect(boardButtons.length).toBeGreaterThan(0);
  });

  it("resolves view=today query alias to dashboard view and normalizes URL", async () => {
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

  it("presses 'N' in goals view to open task composer", async () => {
    await saveAppearanceSettings({ hasCompletedOnboarding: true });
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
});
