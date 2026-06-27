import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectsView } from "../components/ProjectsView";
import { CourseSchema } from "@throughline/domain";
import React from "react";

describe("ProjectsView", () => {
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
      <ProjectsView
        courses={mockCourses}
        tasks={[]}
        onUpsertCourse={vi.fn()}
        onDeleteCourse={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });
});
