import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "../components/Dashboard";
import { CourseSchema, TaskSchema, createFocusSession } from "@throughline/domain";

describe("Dashboard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with tasks and triggers branches", () => {
    const timestamp = new Date().toISOString();
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 2);
    
    // Setup a due soon task
    const soon = new Date();
    soon.setHours(soon.getHours() + 2);

    const mockTasks = [
      TaskSchema.parse({
        id: "1",
        title: "Weekly completed",
        status: "done",
        courseId: "course-1",
        xp: 100,
        estimatedMinutes: 60,
        completedAt: thisWeek.toISOString(),
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      TaskSchema.parse({
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
        color: "blue",
        icon: "📚",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    render(
      <Dashboard
        tasks={mockTasks}
        courses={mockCourses}
        focusSessions={[]}
        onComplete={vi.fn()}
        onUpdateTask={vi.fn()}
        onNewTask={vi.fn()}
        onEdit={vi.fn()}
        onStartFocus={vi.fn()}
      />
    );

    expect(screen.getAllByText("Urgent Due").length).toBeGreaterThan(0);
    expect(screen.getByText("TEST101")).toBeInTheDocument();
  });
  
  it("renders empty state when no tasks are due", () => {
    render(
      <Dashboard
        tasks={[]}
        courses={[]}
        focusSessions={[]}
        onComplete={vi.fn()}
        onUpdateTask={vi.fn()}
        onNewTask={vi.fn()}
        onEdit={vi.fn()}
        onStartFocus={vi.fn()}
      />
    );
    expect(screen.getByText("No urgent work is asking for you right now.")).toBeInTheDocument();
    expect(screen.queryByText("Weekly Insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Academic Rhythm")).not.toBeInTheDocument();
  });

  it("renders truthful Today metrics from tasks and focus sessions", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T15:00:00.000Z"));
    const timestamp = new Date().toISOString();
    const tasks = [
      TaskSchema.parse({
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
      TaskSchema.parse({
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
      TaskSchema.parse({
        id: "task_overdue",
        title: "Submit paper outline",
        status: "ready",
        dueAt: "2026-06-27T20:00:00.000Z",
        tags: [],
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      }),
      TaskSchema.parse({
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

    render(
      <Dashboard
        tasks={tasks}
        courses={[
          CourseSchema.parse({
            id: "course-1",
            name: "Biology",
            code: "BIO",
            color: "#2fa980",
            icon: "B",
            createdAt: timestamp,
            updatedAt: timestamp
          })
        ]}
        focusSessions={[createFocusSession({ startedAt: "2026-06-28T13:00:00.000Z", durationMinutes: 25 })]}
        onComplete={vi.fn()}
        onUpdateTask={vi.fn()}
        onNewTask={vi.fn()}
        onEdit={vi.fn()}
        onStartFocus={vi.fn()}
      />
    );

    expect(screen.getByText("1 of 2 tasks done. Keep it quiet and steady.")).toBeInTheDocument();
    expect(screen.getByText("55m")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText(/1 task is overdue/)).toBeInTheDocument();
    expect(screen.getByText(/Next study block/i)).toBeInTheDocument();
    expect(screen.getAllByText("Read chapter 4")[0]).toBeInTheDocument();
    expect(screen.queryByText("Academic Rhythm")).not.toBeInTheDocument();
  });
});
