import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskSchema } from "@throughline/domain";
import { TaskCard } from "../views/TaskCard";

function makeTask() {
  const timestamp = new Date().toISOString();
  return TaskSchema.parse({
    id: "task-1",
    title: "Essay outline",
    status: "ready",
    priority: "medium",
    difficulty: 2,
    energy: 2,
    order: 0,
    tags: [],
    attributes: ["focus"],
    subtasks: [
      { id: "step-1", title: "Intro", completed: false },
      { id: "step-2", title: "Body", completed: false }
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

describe("TaskCard subtasks", () => {
  it("keeps a renamed title when the checkbox is toggled after an unsaved edit", () => {
    const onUpdateTask = vi.fn();
    const task = makeTask();
    render(<TaskCard task={task} onUpdateTask={onUpdateTask} offerEmptyStepInput />);

    fireEvent.click(screen.getByRole("button", { name: /0 of 2 steps complete/i }));
    const titleInput = screen.getByLabelText("Edit subtask 1");
    fireEvent.change(titleInput, { target: { value: "Revised intro" } });
    // Checkbox click without blur first — drafts must still merge into the write.
    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);

    expect(onUpdateTask).toHaveBeenCalled();
    const payloads = onUpdateTask.mock.calls.map((call) => call[0]);
    expect(payloads.some((payload) => payload.subtasks[0]?.title === "Revised intro" && payload.subtasks[0]?.completed === true)).toBe(
      true
    );
  });

  it("deletes a subtask from the expanded editor", () => {
    const onUpdateTask = vi.fn();
    render(<TaskCard task={makeTask()} onUpdateTask={onUpdateTask} offerEmptyStepInput />);

    fireEvent.click(screen.getByRole("button", { name: /0 of 2 steps complete/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete subtask 1" }));

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: [expect.objectContaining({ id: "step-2", title: "Body" })]
      })
    );
  });

  it("commits a renamed title on blur and trims whitespace", () => {
    const onUpdateTask = vi.fn();
    render(<TaskCard task={makeTask()} onUpdateTask={onUpdateTask} offerEmptyStepInput />);

    fireEvent.click(screen.getByRole("button", { name: /0 of 2 steps complete/i }));
    const titleInput = screen.getByLabelText("Edit subtask 1");
    fireEvent.change(titleInput, { target: { value: "  Thesis statement  " } });
    fireEvent.blur(titleInput);

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: expect.arrayContaining([expect.objectContaining({ id: "step-1", title: "Thesis statement" })])
      })
    );
  });

  it("commits a renamed title when Enter blurs the field", () => {
    const onUpdateTask = vi.fn();
    render(<TaskCard task={makeTask()} onUpdateTask={onUpdateTask} offerEmptyStepInput />);

    fireEvent.click(screen.getByRole("button", { name: /0 of 2 steps complete/i }));
    const titleInput = screen.getByLabelText("Edit subtask 1");
    fireEvent.change(titleInput, { target: { value: "Outline done" } });
    fireEvent.keyDown(titleInput, { key: "Enter" });
    fireEvent.blur(titleInput);

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: expect.arrayContaining([expect.objectContaining({ id: "step-1", title: "Outline done" })])
      })
    );
  });

  it("removes a subtask when the title is cleared on blur", () => {
    const onUpdateTask = vi.fn();
    render(<TaskCard task={makeTask()} onUpdateTask={onUpdateTask} offerEmptyStepInput />);

    fireEvent.click(screen.getByRole("button", { name: /0 of 2 steps complete/i }));
    const titleInput = screen.getByLabelText("Edit subtask 1");
    fireEvent.change(titleInput, { target: { value: "   " } });
    fireEvent.blur(titleInput);

    expect(onUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: [expect.objectContaining({ id: "step-2", title: "Body" })]
      })
    );
  });
});
