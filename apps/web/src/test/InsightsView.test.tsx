import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InsightsView } from "../views/InsightsView";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import { renderWithPlanner } from "./planner-test-utils";

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

    renderWithPlanner(<InsightsView />, {
      planner: { tasks: mockTasks, courses: mockCourses, focusSessions: [], loading: false }
    });

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
    const tasks = [
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
    ];

    renderWithPlanner(<InsightsView />, {
      planner: { tasks, courses: [biology], focusSessions: [], loading: false }
    });

    expect(screen.getByText("Biology is carrying most of this week.")).toBeInTheDocument();
    expect(screen.getByText("You complete more tasks before noon.")).toBeInTheDocument();
  });
});
