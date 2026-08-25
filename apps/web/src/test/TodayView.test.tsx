import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CourseSchema, TaskSchema, createFocusSession } from "@throughline/domain";
import { TodayView } from "../views/TodayView";
import { renderWithPlanner } from "./planner-test-utils";

function parseTask(input: Parameters<typeof TaskSchema.parse>[0]) {
  return TaskSchema.parse(input);
}

describe("TodayView", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with tasks and shows course chips", () => {
    const timestamp = new Date().toISOString();

    const soon = new Date();
    soon.setHours(soon.getHours() + 2);

    const mockTasks = [
      parseTask({
        id: "2",
        title: "Urgent Due",
        status: "ready",
        courseId: "course-1",
        priority: "high",
        difficulty: 4,
        dueAt: soon.toISOString(),
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
        code: "TEST101",
        color: "#3d5afe",
        icon: "T",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />, {
      planner: {
        tasks: mockTasks,
        courses: mockCourses,
        courseById: new Map(mockCourses.map((course) => [course.id, course]))
      }
    });

    expect(screen.getAllByText("Urgent Due").length).toBeGreaterThan(0);
    expect(screen.getByText("TEST101")).toBeInTheDocument();
  });

  it("renders empty state when no tasks are due", () => {
    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByText("No urgent work is asking for you right now.")).toBeInTheDocument();
    expect(screen.queryByText("Weekly Insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Academic Rhythm")).not.toBeInTheDocument();
  });

  it("renders truthful Today metrics from tasks and focus sessions", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T15:00:00.000Z"));
    const timestamp = new Date().toISOString();
    const tasks = [
      parseTask({
        id: "task_done",
        title: "Finish biology lab",
        status: "done",
        courseId: "course-1",
        dueAt: "2026-06-28T20:00:00.000Z",
        completedAt: "2026-06-28T14:00:00.000Z",
        estimatedMinutes: 50,
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      parseTask({
        id: "task_next",
        title: "Read chapter 4",
        status: "ready",
        courseId: "course-1",
        dueAt: "2026-06-28T18:00:00.000Z",
        estimatedMinutes: 35,
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      parseTask({
        id: "task_overdue",
        title: "Submit paper outline",
        status: "ready",
        dueAt: "2026-06-27T20:00:00.000Z",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      // Legacy focus task (pre focus-sessions) still counts toward today's focus total.
      parseTask({
        id: "legacy_focus",
        title: "Focus Session",
        status: "done",
        estimatedMinutes: 30,
        completedAt: "2026-06-28T12:00:00.000Z",
        tags: ["focus"],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />, {
      planner: {
        tasks,
        courses: [
          CourseSchema.parse({
            id: "course-1",
            name: "Biology",
            code: "BIO",
            color: "#1fae67",
            icon: "B",
            createdAt: timestamp,
            updatedAt: timestamp
          })
        ],
        focusSessions: [createFocusSession({ startedAt: "2026-06-28T13:00:00.000Z", durationMinutes: 25 })],
        courseById: new Map()
      }
    });

    expect(screen.getByText("1 of 2 tasks done. Keep it quiet and steady.")).toBeInTheDocument();
    expect(screen.getByText("55m")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText(/1 task is overdue/)).toBeInTheDocument();
    expect(screen.getByText(/Next study block/i)).toBeInTheDocument();
    expect(screen.getAllByText("Read chapter 4")[0]).toBeInTheDocument();
    expect(screen.queryByText("Academic Rhythm")).not.toBeInTheDocument();
  });
});

