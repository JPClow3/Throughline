import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoursesView } from "../views/CoursesView";
import { CourseSchema } from "@throughline/domain";
import React from "react";

describe("CoursesView", () => {
  it("renders heading and description", () => {
    const timestamp = new Date().toISOString();
    const mockCourses = [
      CourseSchema.parse({
        id: "course-1",
        name: "Test Project",
        color: "blue",
        icon: "📚",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    render(
      <CoursesView
        courses={mockCourses}
        tasks={[]}
        onUpsertCourse={vi.fn()}
        onDeleteCourse={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("opens a project on the Board when requested", () => {
    const timestamp = new Date().toISOString();
    const onOpenOnBoard = vi.fn();
    const mockCourses = [
      CourseSchema.parse({
        id: "course-1",
        name: "Test Project",
        color: "blue",
        icon: "📚",
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ];

    render(
      <CoursesView
        courses={mockCourses}
        tasks={[]}
        onUpsertCourse={vi.fn()}
        onDeleteCourse={vi.fn()}
        onOpenOnBoard={onOpenOnBoard}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Test Project on Board" }));
    expect(onOpenOnBoard).toHaveBeenCalledWith("course-1");
  });
});

