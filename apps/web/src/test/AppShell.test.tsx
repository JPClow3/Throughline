import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "../shell/AppShell";

describe("AppShell", () => {
  it("opens command palette from the global search control", () => {
    const onOpenCommandPalette = vi.fn();
    render(
      <AppShell view="dashboard" onViewChange={vi.fn()} onNewTask={vi.fn()} onOpenCommandPalette={onOpenCommandPalette}>
        <h1>Today</h1>
      </AppShell>
    );

    const triggers = screen.getAllByRole("button", { name: "Open global search" });
    fireEvent.click(triggers[0]);

    expect(onOpenCommandPalette).toHaveBeenCalled();
  });

  it("renders one configured mobile primary action", () => {
    const onPrimary = vi.fn();
    const { container } = render(
      <AppShell
        view="dashboard"
        onViewChange={vi.fn()}
        onNewTask={onPrimary}
        primaryActionLabel="New task"
      >
        <h1>Today</h1>
      </AppShell>
    );

    const mobileAction = container.querySelector(".shell-mobile-primary-action");
    expect(mobileAction).toBeInTheDocument();
    fireEvent.click(mobileAction as HTMLElement);
    expect(onPrimary).toHaveBeenCalled();
  });

  it("omits the mobile primary action when none is configured", () => {
    const { container } = render(
      <AppShell view="settings" onViewChange={vi.fn()} onNewTask={vi.fn()}>
        <h1>Settings</h1>
      </AppShell>
    );

    expect(container.querySelector(".shell-mobile-primary-action")).not.toBeInTheDocument();
  });

  it("exposes every view as a labelled navigation anchor", () => {
    render(
      <AppShell view="dashboard" onViewChange={vi.fn()} onNewTask={vi.fn()}>
        <h1>Today</h1>
      </AppShell>
    );

    for (const label of ["Today", "Goals", "Board", "Timeline", "Notes", "Projects", "Insights", "Settings"]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
  });
});
