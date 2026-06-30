import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsView } from "../pages/InsightsView";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import * as useTasksHook from "../hooks/useTasks";
import * as useFocusSessionsHook from "../hooks/useFocusSessions";

// Mock the useTasks hook
vi.mock("../hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

vi.mock("../hooks/useFocusSessions", () => ({
  useFocusSessions: vi.fn(),
}));

describe("InsightsView", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    vi.mocked(useFocusSessionsHook.useFocusSessions).mockReturnValue({
      focusSessions: [],
      loading: false,
      recordFocusSession: vi.fn(),
      updateFocusSession: vi.fn(),
      deleteFocusSession: vi.fn()
    });

    render(
      <div>
        <InsightsView />
      </div>
    );

    expect(screen.getByText("What to adjust this week")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getAllByText(/1/)[0]).toBeInTheDocument();
    expect(screen.getByLabelText("Completed tasks over the last 28 days")).toBeInTheDocument();
  });

  it("renders coaching prompts", () => {
    vi.useFakeTimers();
    const timestamp = "2026-06-28T12:00:00.000Z";
    vi.setSystemTime(new Date("2026-06-28T15:00:00.000Z"));
    const biology = CourseSchema.parse({
      id: "course-1",
      name: "Biology",
      color: "blue",
      icon: "B",
      createdAt: timestamp,
      updatedAt: timestamp
    });
    vi.mocked(useTasksHook.useTasks).mockReturnValue({
      tasks: [
        TaskSchema.parse({
          id: "1",
          title: "Bio lab",
          status: "done",
          courseId: biology.id,
          completedAt: "2026-06-28T09:00:00.000Z",
          estimatedMinutes: 60,
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp
        }),
        TaskSchema.parse({
          id: "2",
          title: "Bio quiz",
          status: "done",
          courseId: biology.id,
          completedAt: "2026-06-27T10:00:00.000Z",
          estimatedMinutes: 45,
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp
        })
      ],
      courses: [biology],
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
    vi.mocked(useFocusSessionsHook.useFocusSessions).mockReturnValue({
      focusSessions: [],
      loading: false,
      recordFocusSession: vi.fn(),
      updateFocusSession: vi.fn(),
      deleteFocusSession: vi.fn()
    });

    render(<InsightsView />);

    expect(screen.getByText("Biology is carrying most of this week.")).toBeInTheDocument();
    expect(screen.getByText("You complete more tasks before noon.")).toBeInTheDocument();
  });
});
