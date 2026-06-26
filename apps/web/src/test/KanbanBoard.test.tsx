import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "../components/KanbanBoard";
import { CourseSchema, TaskSchema } from "@throughline/domain";

describe("KanbanBoard", () => {
  it("renders columns and tasks", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
    const timestamp = new Date().toISOString();
    const mockTasks = [
      TaskSchema.parse({
        id: "1",
        title: "Test Todo",
        status: "ready",
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      TaskSchema.parse({
        id: "2",
        title: "Test In Progress",
        status: "doing",
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      TaskSchema.parse({
        id: "3",
        title: "Test Done",
        status: "done",
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    const mockCourses = [
      CourseSchema.parse({
        id: "course-1",
        name: "Test Course",
        color: "blue",
        icon: "📚",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    render(
      <div>
        <KanbanBoard
          tasks={mockTasks}
          courses={mockCourses}
          onComplete={vi.fn()}
          onStatusChange={vi.fn()}
          onEdit={vi.fn()}
        />
      </div>
    );

    // Columns
    expect(screen.getByRole("heading", { name: "Ready" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Doing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();

    // Tasks
    expect(screen.getByText("Test Todo")).toBeInTheDocument();
    expect(screen.getByText("Test In Progress")).toBeInTheDocument();
    expect(screen.getByText("Test Done")).toBeInTheDocument();
  });
});
