import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import { TimelineView } from "../views/TimelineView";
import { renderWithPlanner } from "./planner-test-utils";

describe("TimelineView", () => {
  it("renders timeline with tasks", () => {
    const timestamp = new Date().toISOString();
    const dueAt = new Date();
    dueAt.setHours(14, 0, 0, 0); // 2pm today
    const dueAtIso = dueAt.toISOString();

    const mockTasks = [
      TaskSchema.parse({
        id: "1",
        title: "Test Timeline Task",
        status: "ready",
        courseId: "course-1",
        tags: [],
        subtasks: [],
        dueAt: dueAtIso,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    const mockCourses = [
      CourseSchema.parse({
        id: "course-1",
        name: "Test Course",
        color: "#3d5afe",
        icon: "T",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    renderWithPlanner(
      <TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />,
      {
        planner: {
          tasks: mockTasks,
          courses: mockCourses,
          courseById: new Map(mockCourses.map((course) => [course.id, course]))
        }
      }
    );

    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Test Timeline Task")).toBeInTheDocument();
  });

  it("shows the empty state for a day without tasks", () => {
    renderWithPlanner(<TimelineView />, {});

    // Today is selected by default and there are no tasks.
    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
  });

  it("triggers onEdit callback when task title is clicked", () => {
    const onEdit = vi.fn();
    const timestamp = new Date().toISOString();
    const dueAt = new Date();
    dueAt.setHours(14, 0, 0, 0);
    const mockTask = TaskSchema.parse({
      id: "task-edit-1",
      title: "Interactive Timeline Task",
      status: "ready",
      courseId: "course-1",
      tags: [],
      subtasks: [],
      dueAt: dueAt.toISOString(),
      createdAt: timestamp,
      updatedAt: timestamp
    });

    renderWithPlanner(
      <TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} onEdit={onEdit} />,
      {
        planner: {
          tasks: [mockTask],
          courses: [],
          courseById: new Map()
        }
      }
    );

    const editBtn = screen.getByRole("button", { name: "Interactive Timeline Task" });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "task-edit-1" }));
  });
});
