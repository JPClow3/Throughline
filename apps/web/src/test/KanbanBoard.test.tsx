import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "../components/KanbanBoard";
import { Task, Course, TaskStatus } from "@throughline/domain";

describe("KanbanBoard", () => {
  it("renders columns and tasks", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });
    const mockTasks: Task[] = [
      {
        id: "1",
        title: "Test Todo",
        status: "ready" as TaskStatus,
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Test In Progress",
        status: "doing" as TaskStatus,
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "3",
        title: "Test Done",
        status: "done" as TaskStatus,
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockCourses: Course[] = [
      { id: "course-1", title: "Test Course", color: "blue", archived: false }
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
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Doing")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();

    // Tasks
    expect(screen.getByText("Test Todo")).toBeInTheDocument();
    expect(screen.getByText("Test In Progress")).toBeInTheDocument();
    expect(screen.getByText("Test Done")).toBeInTheDocument();
  });
});
