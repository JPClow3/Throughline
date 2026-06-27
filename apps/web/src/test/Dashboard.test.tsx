import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "../components/Dashboard";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import React from "react";

describe("Dashboard", () => {
  it("renders with tasks and triggers branches", () => {
    const timestamp = new Date().toISOString();
    
    // Setup a completed task from this week to hit weeklyXP and timePerCourse branches
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
        onComplete={vi.fn()}
        onUpdateTask={vi.fn()}
        onNewTask={vi.fn()}
        onEdit={vi.fn()}
        onStartFocus={vi.fn()}
      />
    );

    // Verify it rendered the due soon task
    expect(screen.getByText("Urgent Due")).toBeInTheDocument();
    
    // Verify it rendered the course insights
    expect(screen.getByText("TEST101")).toBeInTheDocument();
  });
  
  it("renders empty state when no tasks are due", () => {
    render(
      <Dashboard
        tasks={[]}
        courses={[]}
        onComplete={vi.fn()}
        onUpdateTask={vi.fn()}
        onNewTask={vi.fn()}
        onEdit={vi.fn()}
        onStartFocus={vi.fn()}
      />
    );
    expect(screen.getByText("No tasks due soon.")).toBeInTheDocument();
  });
});
