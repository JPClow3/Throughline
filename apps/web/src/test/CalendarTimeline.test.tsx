import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalendarTimeline } from "../components/CalendarTimeline";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import React from "react";

describe("CalendarTimeline", () => {
  it("renders timeline with tasks", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

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
        color: "blue",
        icon: "📚",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    render(
      <CalendarTimeline
        tasks={mockTasks}
        courses={mockCourses}
        goals={[]}
        onNewTask={vi.fn()}
        onStartFocus={vi.fn()}
        onUpdateTask={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Test Timeline Task")).toBeInTheDocument();
  });
});
