import { createTask, sampleCourses } from "@liquidglass-todo/domain";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskCard } from "../components/TaskCard";
import { SettingsPanel } from "../components/SettingsPanel";
import { TaskComposer } from "../components/TaskComposer";

describe("calm planner UI components", () => {
  it("captures quick task fields and optional expanded details", async () => {
    const onAddTask = vi.fn().mockResolvedValue(undefined);
    render(<TaskComposer courses={sampleCourses} onAddTask={onAddTask} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Write research outline" } });
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Draft the argument and source list." } });
    fireEvent.change(screen.getByLabelText("Reminder"), { target: { value: "2026-06-04T09:30" } });
    fireEvent.change(screen.getByLabelText("Tags"), { target: { value: "paper, seminar" } });
    fireEvent.change(screen.getByLabelText("Subtasks"), { target: { value: "Choose thesis\nCollect sources" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(onAddTask).toHaveBeenCalled());
    expect(onAddTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Write research outline",
        description: "Draft the argument and source list.",
        reminderAt: "2026-06-04T09:30",
        tags: ["paper", "seminar"],
        subtasks: [
          expect.objectContaining({ title: "Choose thesis", completed: false }),
          expect.objectContaining({ title: "Collect sources", completed: false })
        ]
      })
    );
  });

  it("renders a calm task card with title, checklist progress, and status control", () => {
    const task = createTask({
      title: "Finish studio critique",
      description: "Refine the calm planner comparison.",
      dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      priority: "high",
      subtasks: [
        { id: "subtask_one", title: "Screenshots", completed: true },
        { id: "subtask_two", title: "Reflection", completed: false }
      ]
    });

    render(<TaskCard task={task} course={sampleCourses[1]} onStatusChange={() => {}} />);

    expect(screen.getByText("Finish studio critique")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByLabelText("Move Finish studio critique")).toHaveValue("backlog");
    // The calm card keeps XP hidden unless the game layer is enabled.
    expect(screen.queryByText(`${task.xp} XP`)).not.toBeInTheDocument();
  });

  it("reveals XP only when the game layer is enabled", () => {
    const task = createTask({ title: "Read chapter six", priority: "medium" });

    render(<TaskCard task={task} showGameLayer onComplete={() => {}} />);

    expect(screen.getByText(`${task.xp} XP`)).toBeInTheDocument();
  });

  it("exposes utility settings", () => {
    render(
      <SettingsPanel
        tasks={[]}
        courses={sampleCourses}
        appearanceSettings={{
          id: "appearance-settings",
          lowPower3d: false,
          theme: "system",
          showGameLayer: false,
          updatedAt: "2026-05-29T00:00:00.000Z"
        }}
        onAppearanceChange={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("App readiness")).toBeInTheDocument();
    expect(screen.getByText("Calendar export")).toBeInTheDocument();
  });

  it("switches the theme preference from settings", async () => {
    const onAppearanceChange = vi.fn().mockResolvedValue({
      id: "appearance-settings",
      lowPower3d: false,
      theme: "dark",
      showGameLayer: false,
      updatedAt: "2026-05-29T00:00:00.000Z"
    });

    render(
      <SettingsPanel
        tasks={[]}
        courses={sampleCourses}
        appearanceSettings={{
          id: "appearance-settings",
          lowPower3d: false,
          theme: "system",
          showGameLayer: false,
          updatedAt: "2026-05-29T00:00:00.000Z"
        }}
        onAppearanceChange={onAppearanceChange}
      />
    );

    expect(screen.getByText("Appearance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    await waitFor(() => expect(onAppearanceChange).toHaveBeenCalledWith({ theme: "dark" }));
  });
});
