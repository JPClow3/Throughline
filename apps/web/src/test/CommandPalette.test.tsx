import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "../views/CommandPalette";

describe("CommandPalette", () => {
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

  it("shows global search results and opens the selected result", () => {
    const onOpenResult = vi.fn();
    render(
      <CommandPalette
        open
        setOpen={vi.fn()}
        onNavigate={vi.fn()}
        onNewTask={vi.fn()}
        onToggleTheme={vi.fn()}
        searchResults={[
          {
            id: "task_1",
            type: "task",
            title: "Finish biology lab",
            subtitle: "Task",
            view: "kanban",
            groupLabel: "Tasks",
            lastTouchedAt: "2026-06-28T12:00:00.000Z",
            actionLabel: "Open task"
          }
        ]}
        onOpenResult={onOpenResult}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Type a command or search..."), { target: { value: "biology" } });
    fireEvent.click(screen.getByText("Finish biology lab"));

    expect(onOpenResult).toHaveBeenCalledWith(expect.objectContaining({ id: "task_1", type: "task" }));
  });

  it("renders 'Go to Insights' and navigates to insights view when selected", () => {
    const onNavigate = vi.fn();
    const setOpen = vi.fn();

    render(
      <CommandPalette
        open
        setOpen={setOpen}
        onNavigate={onNavigate}
        onNewTask={vi.fn()}
        onToggleTheme={vi.fn()}
      />
    );

    const insightsItem = screen.getByText("Go to Insights");
    expect(insightsItem).toBeInTheDocument();

    fireEvent.click(insightsItem);

    expect(onNavigate).toHaveBeenCalledWith("insights");
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("renders all expected navigation options", () => {
    render(
      <CommandPalette
        open
        setOpen={vi.fn()}
        onNavigate={vi.fn()}
        onNewTask={vi.fn()}
        onToggleTheme={vi.fn()}
      />
    );

    expect(screen.getByText("Go to Today")).toBeInTheDocument();
    expect(screen.getByText("Go to Goals")).toBeInTheDocument();
    expect(screen.getByText("Go to Board")).toBeInTheDocument();
    expect(screen.getByText("Go to Timeline")).toBeInTheDocument();
    expect(screen.getByText("Go to Notes")).toBeInTheDocument();
    expect(screen.getByText("Go to Projects")).toBeInTheDocument();
    expect(screen.getByText("Go to Insights")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("dismisses command palette when clicking the backdrop", () => {
    const setOpen = vi.fn();

    render(
      <CommandPalette
        open
        setOpen={setOpen}
        onNavigate={vi.fn()}
        onNewTask={vi.fn()}
        onToggleTheme={vi.fn()}
      />
    );

    const backdrop = document.querySelector(".palette-backdrop");
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(setOpen).toHaveBeenCalledWith(false);
    }
  });

  it("restores focus to previous active element upon close", async () => {
    const triggerBtn = document.createElement("button");
    triggerBtn.textContent = "Open Palette";
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

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
    expect(document.activeElement).toBe(triggerBtn);
    document.body.removeChild(triggerBtn);
  });
});

