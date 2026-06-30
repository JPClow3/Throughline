import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "../components/CommandPalette";

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
});
