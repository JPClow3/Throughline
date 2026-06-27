import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InsightsView } from "../pages/InsightsView";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import * as useTasksHook from "../hooks/useTasks";

// Mock the useTasks hook
vi.mock("../hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

describe("InsightsView", () => {
  it("renders statistics correctly", () => {
    const timestamp = new Date().toISOString();
    const mockTasks = [
      TaskSchema.parse({
        id: "1",
        title: "Test Done 1",
        status: "done",
        courseId: "course-1",
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: timestamp
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

    vi.mocked(useTasksHook.useTasks).mockReturnValue({
      tasks: mockTasks,
      courses: mockCourses,
      progress: undefined,
      addTask: vi.fn(),
      updateTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      deleteTask: vi.fn(),
      completeTask: vi.fn(),
      upsertCourse: vi.fn(),
      deleteCourse: vi.fn(),
      recordFocusSession: vi.fn(),
      loading: false
    });

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
