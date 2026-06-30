import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "../components/AppShell";

describe("AppShell", () => {
  it("opens command palette from the global search control", () => {
    const onOpenCommandPalette = vi.fn();
    render(
      <AppShell view="dashboard" onViewChange={vi.fn()} onNewTask={vi.fn()} onOpenCommandPalette={onOpenCommandPalette}>
        <h1>Today</h1>
      </AppShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open global search" }));

    expect(onOpenCommandPalette).toHaveBeenCalled();
  });

  it("renders one configured mobile primary action", () => {
    const onPrimary = vi.fn();
    const { container } = render(
      <AppShell
        view="dashboard"
        onViewChange={vi.fn()}
        onNewTask={vi.fn()}
        primaryAction={{ label: "New task", icon: <span>+</span>, onClick: onPrimary }}
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
});
