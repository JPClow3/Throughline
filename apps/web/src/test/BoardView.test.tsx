import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import { BoardView } from "../views/BoardView";
import { renderWithPlanner } from "./planner-test-utils";

function stubMatchMedia(matchingQuery?: string) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === matchingQuery,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
  return () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  };
}

describe("BoardView", () => {
  it("renders columns and tasks", () => {
    const restore = stubMatchMedia();
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
        color: "#3d5afe",
        icon: "T",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    const onStatusChange = vi.fn();

    renderWithPlanner(
      <BoardView onComplete={vi.fn()} onStatusChange={onStatusChange} onEdit={vi.fn()} />,
      {
        planner: {
          tasks: mockTasks,
          courses: mockCourses,
          courseById: new Map(mockCourses.map((course) => [course.id, course]))
        }
      }
    );

    // Columns
    expect(screen.getByRole("heading", { name: "Ready" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Doing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();

    // Tasks
    expect(screen.getByText("Test Todo")).toBeInTheDocument();
    expect(screen.getByText("Test In Progress")).toBeInTheDocument();
    expect(screen.getByText("Test Done")).toBeInTheDocument();

    // Keyboard interactions for coverage
    const todoCard = document.getElementById("task-card-1");
    if (todoCard) {
      fireEvent.keyDown(todoCard, { key: "Enter" }); // onEdit
      fireEvent.keyDown(todoCard, { key: " " }); // onComplete

      // Ctrl+ArrowLeft/Right
      fireEvent.keyDown(todoCard, { key: "ArrowRight", ctrlKey: true }); // Move to next column
      expect(onStatusChange).toHaveBeenCalledWith("1", "doing");
      expect(screen.getByText("Moved Test Todo to Doing.")).toBeInTheDocument();
      fireEvent.keyDown(todoCard, { key: "ArrowLeft", ctrlKey: true }); // Move to prev column

      // Up/Down/Left/Right
      fireEvent.keyDown(todoCard, { key: "ArrowDown" });
      fireEvent.keyDown(todoCard, { key: "ArrowUp" });
      fireEvent.keyDown(todoCard, { key: "ArrowRight" });
      fireEvent.keyDown(todoCard, { key: "ArrowLeft" });
    }
    restore();
  });

  it("uses status tabs for the mobile board", () => {
    const restore = stubMatchMedia("(max-width: 1100px)");
    const timestamp = new Date().toISOString();
    const mockTasks = [
      TaskSchema.parse({
        id: "1",
        title: "Mobile Ready Task",
        status: "ready",
        courseId: "course-1",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      TaskSchema.parse({
        id: "2",
        title: "Mobile Doing Task",
        status: "doing",
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
        color: "#3d5afe",
        icon: "T",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];
    const onStatusChange = vi.fn();

    renderWithPlanner(
      <BoardView onComplete={vi.fn()} onStatusChange={onStatusChange} onEdit={vi.fn()} />,
      {
        planner: {
          tasks: mockTasks,
          courses: mockCourses,
          courseById: new Map(mockCourses.map((course) => [course.id, course]))
        }
      }
    );

    expect(screen.getByRole("tab", { name: /Backlog/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Mobile Ready Task")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Ready/i }));
    expect(screen.getByText("Mobile Ready Task")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Doing/i }));
    expect(screen.getByText("Mobile Doing Task")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Move Mobile Doing Task"), { target: { value: "done" } });
    expect(onStatusChange).toHaveBeenCalledWith("2", "done");

    restore();
  });
});

