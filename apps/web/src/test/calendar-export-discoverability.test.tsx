import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskSchema } from "@throughline/domain";
import { downloadIcs } from "../lib/downloadIcs";
import { renderWithPlanner } from "./planner-test-utils";
import { TimelineView } from "../views/TimelineView";
import { TodayView } from "../views/TodayView";

vi.mock("../lib/downloadIcs", () => ({
  downloadIcs: vi.fn()
}));

describe("calendar export discoverability", () => {
  beforeEach(() => {
    vi.mocked(downloadIcs).mockReset();
  });

  function dueTask(id: string, title: string) {
    const timestamp = new Date().toISOString();
    const due = new Date();
    due.setHours(18, 0, 0, 0);
    return TaskSchema.parse({
      id,
      title,
      status: "ready",
      priority: "medium",
      difficulty: 2,
      energy: 2,
      order: 0,
      tags: [],
      attributes: ["focus"],
      subtasks: [],
      dueAt: due.toISOString(),
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  it("exports ICS from Today pressure panel", () => {
    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />, {
      planner: { tasks: [dueTask("due-1", "Lab writeup")] }
    });
    fireEvent.click(screen.getByRole("button", { name: /Export due tasks as calendar ICS/i }));
    expect(downloadIcs).toHaveBeenCalled();
  });

  it("exports ICS from Timeline header", () => {
    renderWithPlanner(<TimelineView />, {
      planner: { tasks: [dueTask("due-2", "Reading")] }
    });
    fireEvent.click(screen.getByRole("button", { name: /Export due tasks as calendar ICS/i }));
    expect(downloadIcs).toHaveBeenCalled();
  });
});
