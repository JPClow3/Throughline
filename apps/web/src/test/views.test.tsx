import { createNote, sampleCourses, sampleGoals, sampleNotes, sampleTasks } from "@throughline/domain";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { GoalsView } from "../components/GoalsView";
import { NoteEditor } from "../components/NoteEditor";
import { NotesView } from "../components/NotesView";
import { ProjectsManager } from "../components/ProjectsManager";
import { TaskEditor } from "../components/TaskEditor";

const noop = () => {};
const asyncNoop = () => Promise.resolve();

function GoalsHarness() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <GoalsView
      goals={sampleGoals}
      tasks={sampleTasks}
      courses={sampleCourses}
      notes={sampleNotes}
      selectedId={selectedId}
      onSelectGoal={setSelectedId}
      onNewGoal={noop}
      onSetGoalStatus={asyncNoop}
      onDeleteGoal={asyncNoop}
      onEditGoal={noop}
      onAddTask={asyncNoop}
      onAddNote={vi.fn().mockResolvedValue(sampleNotes[0])}
      onCompleteTask={noop}
      onStatusChange={noop}
      onEditTask={noop}
      onReorderTask={asyncNoop}
    />
  );
}

describe("GoalsView", () => {
  it("shows goals with roll-up progress and opens a goal detail", () => {
    render(<GoalsHarness />);

    expect(screen.getByText("Launch my side project")).toBeInTheDocument();
    // 1 of 4 seeded steps complete -> 25% roll-up.
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("1/4 steps")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Launch my side project/ }));

    expect(screen.getByText("Tasks toward this goal")).toBeInTheDocument();
    expect(screen.getByText("Build the first working version")).toBeInTheDocument();
    expect(screen.getByText("Linked notes")).toBeInTheDocument();
  });
});

describe("NotesView", () => {
  it("lists notes and opens an editor showing linked task and goal", () => {
    render(
      <NotesView
        notes={sampleNotes}
        tasks={sampleTasks}
        goals={sampleGoals}
        onAddNote={vi.fn().mockResolvedValue(sampleNotes[0])}
        onUpdateNote={vi.fn().mockResolvedValue(sampleNotes[0])}
        onRemoveNote={asyncNoop}
        onToggleLink={noop}
      />
    );

    fireEvent.click(screen.getByText("Landing page ideas"));

    expect(screen.getByLabelText("Note title")).toHaveValue("Landing page ideas");
    // Linked goal and task surface as chips in the editor.
    expect(screen.getByText("Launch my side project")).toBeInTheDocument();
    expect(screen.getByText("Wire up the landing page")).toBeInTheDocument();
  });

  it("auto-selects the best note on desktop", async () => {
    const pinned = createNote({ title: "Pinned seminar note", body: "Use this first.", pinned: true });
    const other = createNote({ title: "Loose idea", body: "Later." });

    render(
      <NotesView
        notes={[other, pinned]}
        tasks={[]}
        goals={[]}
        onAddNote={vi.fn().mockResolvedValue(pinned)}
        onUpdateNote={vi.fn().mockResolvedValue(pinned)}
        onRemoveNote={asyncNoop}
        onToggleLink={noop}
      />
    );

    await waitFor(() => expect(screen.getByLabelText("Note title")).toHaveValue("Pinned seminar note"));
  });

  it("uses list-first note navigation on mobile", () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width: 720px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    render(
      <NotesView
        notes={sampleNotes}
        tasks={sampleTasks}
        goals={sampleGoals}
        onAddNote={vi.fn().mockResolvedValue(sampleNotes[0])}
        onUpdateNote={vi.fn().mockResolvedValue(sampleNotes[0])}
        onRemoveNote={asyncNoop}
        onToggleLink={noop}
      />
    );

    expect(screen.queryByLabelText("Note title")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Landing page ideas"));
    expect(screen.getByLabelText("Note title")).toHaveValue("Landing page ideas");
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    expect(screen.queryByLabelText("Note title")).not.toBeInTheDocument();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  });
});

describe("ProjectsManager", () => {
  it("lists projects and adds a new one", async () => {
    const onUpsertCourse = vi.fn().mockResolvedValue(undefined);
    render(
      <ProjectsManager
        courses={sampleCourses}
        tasks={sampleTasks}
        onUpsertCourse={onUpsertCourse}
        onDeleteCourse={asyncNoop}
      />
    );

    expect(screen.getByText("Side project")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("New project name"), { target: { value: "Thesis" } });
    fireEvent.click(screen.getByRole("button", { name: "Add project" }));

    await waitFor(() =>
      expect(onUpsertCourse).toHaveBeenCalledWith(expect.objectContaining({ name: "Thesis" }))
    );
  });
});

describe("TaskEditor", () => {
  it("saves edits and deletes a task", async () => {
    const task = sampleTasks[0];
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(<TaskEditor task={task} courses={sampleCourses} onSave={onSave} onDelete={onDelete} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated title" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: task.id, title: "Updated title" }))
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(task.id);
  });
});

describe("NoteEditor", () => {
  it("renders a markdown preview", () => {
    const note = createNote({ title: "Markdown", body: "# Heading\n\nSome **bold** text" });

    render(
      <NoteEditor
        note={note}
        tasks={[]}
        goals={[]}
        onSave={() => {}}
        onDelete={() => {}}
        onToggleLink={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
  });
});
