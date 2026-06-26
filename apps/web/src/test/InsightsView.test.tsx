import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightsView } from "../pages/InsightsView";
import { Task, Course, TaskStatus } from "@throughline/domain";
import * as useTasksHook from "../hooks/useTasks";

// Mock the useTasks hook
vi.mock("../hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

describe("InsightsView", () => {
  it("renders statistics correctly", () => {
    const mockTasks: Task[] = [
      {
        id: "1",
        title: "Test Done 1",
        status: "done" as TaskStatus,
        courseId: "course-1",
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString() // completed today
      }
    ];

    const mockCourses: Course[] = [
      { id: "course-1", title: "Test Course", color: "blue", archived: false }
    ];

    vi.mocked(useTasksHook.useTasks).mockReturnValue({
      tasks: mockTasks,
      courses: mockCourses,
      projects: mockCourses,
      addTask: vi.fn(),
      updateTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      deleteTask: vi.fn(),
      isLoading: false
    } as any);

    render(
      <div>
        <InsightsView />
      </div>
    );

    // Tests for stats being shown
    expect(screen.getAllByText(/Total Completed/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/1/)[0]).toBeInTheDocument();
  });
});
