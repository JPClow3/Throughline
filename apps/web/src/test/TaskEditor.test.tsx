import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskEditor } from "../components/TaskEditor";
import { CourseSchema, TaskSchema } from "@throughline/domain";
import React from "react";

describe("TaskEditor", () => {
  it("renders task editor and handles input", async () => {
    const timestamp = new Date().toISOString();
    const mockTask = TaskSchema.parse({
      id: "1",
      title: "Test Task",
      status: "ready",
      courseId: "course-1",
      priority: "medium",
      tags: ["test"],
      subtasks: [],
      createdAt: timestamp,
      updatedAt: timestamp
    });

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

    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskEditor
        task={mockTask}
        courses={mockCourses}
        goals={[]}
        onSave={onSave}
        onDelete={onDelete}
      />
    );

    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();

    // Add subtask
    fireEvent.click(screen.getByRole("button", { name: /Add step/i }));
    
    const subtaskInputs = screen.getAllByPlaceholderText("Subtask title");
    expect(subtaskInputs.length).toBe(1);
    fireEvent.change(subtaskInputs[0], { target: { value: "New subtask" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    // Delete
    fireEvent.click(screen.getByText(/Delete/i));
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
