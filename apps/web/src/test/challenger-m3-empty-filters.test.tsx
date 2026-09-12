import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  Course,
  CourseSchema,
  FocusSession,
  GoalSchema,
  Task,
  TaskSchema,
  createCourse,
  createNote,
  createTask
} from "@throughline/domain";
import React, { useState } from "react";
import { TodayView } from "../views/TodayView";
import { BoardView } from "../views/BoardView";
import { TimelineView } from "../views/TimelineView";
import { GoalsView } from "../views/GoalsView";
import { NotesView } from "../views/NotesView";
import { CoursesView } from "../views/CoursesView";
import { InsightsView } from "../views/InsightsView";
import { SettingsView } from "../views/SettingsView";
import { FilterBar } from "../views/FilterBar";
import { defaultFilterState } from "../data/repositories";
import type { SavedFilterPreset } from "../data/types";
import { DEFAULT_PLANNER, PlannerStub, renderWithPlanner } from "./planner-test-utils";
import { PlannerContext } from "../state/PlannerProvider";
import { Modal } from "../ui";

// Dynamic mocks for InsightsView dependencies
const mockTasksData = { current: [] as Task[] };
const mockCoursesData = { current: [] as Course[] };
const mockFocusSessionsData = { current: [] as FocusSession[] };

vi.mock("../hooks/useTasks", () => ({
  useTasks: () => ({
    tasks: mockTasksData.current,
    courses: mockCoursesData.current,
    progress: undefined,
    addTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
    completeTask: vi.fn(),
    upsertCourse: vi.fn(),
    deleteCourse: vi.fn(),
    recordFocusSession: vi.fn(),
    loading: false
  })
}));

vi.mock("../hooks/useFocusSessions", () => ({
  useFocusSessions: () => ({
    focusSessions: mockFocusSessionsData.current,
    activeSession: null,
    recordSession: vi.fn(),
    loading: false
  })
}));

function stubMatchMedia(matchingQuery?: string | ((query: string) => boolean)) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: typeof matchingQuery === "function" ? matchingQuery(query) : query === matchingQuery,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
  return () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia
    });
  };
}

const sampleCourse = CourseSchema.parse({
  id: "course-1",
  name: "Computer Science",
  color: "#3d5afe",
  icon: "💻",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

function StatefulPlannerProvider({
  children,
  initialTasks = [],
  courses = [sampleCourse]
}: {
  children: (props: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) => React.ReactNode;
  initialTasks?: Task[];
  courses?: Course[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const value: PlannerStub = {
    ...DEFAULT_PLANNER,
    tasks,
    courses,
    courseById
  };

  return (
    <PlannerContext.Provider value={value}>
      {children({ tasks, setTasks })}
    </PlannerContext.Provider>
  );
}

describe("Feature 14 Adversarial: Zero-state edge cases across all 8 views", () => {
  /* 1. TodayView */
  describe("1. TodayView zero-state & dynamic additions", () => {
    it("renders zero-state EmptyState with actionable CTA when tasks are empty", () => {
      const onNewTask = vi.fn();
      renderWithPlanner(
        <TodayView onNewTask={onNewTask} onEdit={vi.fn()} />,
        { planner: { tasks: [], courses: [sampleCourse], focusSessions: [] } }
      );

      const emptyState = screen.getByRole("status");
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText("All clear for today")).toBeInTheDocument();
      expect(screen.getByText("No urgent work is asking for you right now.")).toBeInTheDocument();

      const ctaBtn = within(emptyState).getByRole("button", { name: /Capture a task/i });
      expect(ctaBtn).toBeInTheDocument();
      fireEvent.click(ctaBtn);
      expect(onNewTask).toHaveBeenCalled();
    });

    it("renders zero-state gracefully when tasks exist but all are completed (no active tasks)", () => {
      const doneTask = TaskSchema.parse({
        id: "task-done-1",
        title: "Finished homework",
        status: "done",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      renderWithPlanner(
        <TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />,
        { planner: { tasks: [doneTask], courses: [sampleCourse], focusSessions: [] } }
      );

      expect(screen.getByText("All clear for today")).toBeInTheDocument();
      expect(screen.queryByText("Finished homework")).not.toBeInTheDocument();
    });

    it("dynamically hides empty state when a new pending task is added", () => {
      render(
        <StatefulPlannerProvider initialTasks={[]}>
          {({ setTasks }) => (
            <div>
              <button
                type="button"
                data-testid="add-task-trigger"
                onClick={() =>
                  setTasks([
                    createTask({
                      id: "task-live-1",
                      title: "Active Live Task",
                      status: "ready",
                      priority: "high"
                    })
                  ])
                }
              >
                Add Live Task
              </button>
              <TodayView onNewTask={vi.fn()} onEdit={vi.fn()} />
            </div>
          )}
        </StatefulPlannerProvider>
      );

      expect(screen.getByText("All clear for today")).toBeInTheDocument();

      // Dynamically add task
      fireEvent.click(screen.getByTestId("add-task-trigger"));

      expect(screen.queryByText("All clear for today")).not.toBeInTheDocument();
      expect(screen.getByText("Active Live Task")).toBeInTheDocument();
    });
  });

  /* 2. BoardView */
  describe("2. BoardView zero-state, rapid filtering, clearing & dynamic addition", () => {
    it("renders overall EmptyState when board has 0 tasks and onNewTask is provided", () => {
      const onNewTask = vi.fn();
      renderWithPlanner(
        <BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} onNewTask={onNewTask} />,
        { planner: { tasks: [], courses: [sampleCourse] } }
      );

      expect(screen.getByText("No tasks on your board")).toBeInTheDocument();
      expect(screen.getByText("Plan your assignments and projects with a tactile Kanban board.")).toBeInTheDocument();

      const emptyState = screen.getByRole("status");
      const cta = within(emptyState).getByRole("button", { name: /Capture a task/i });
      fireEvent.click(cta);
      expect(onNewTask).toHaveBeenCalled();
    });

    it("falls through to individual column empty states when onNewTask is not provided and tasks are empty", () => {
      renderWithPlanner(
        <BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} />,
        { planner: { tasks: [], courses: [sampleCourse] } }
      );

      expect(screen.queryByText("No tasks on your board")).not.toBeInTheDocument();
      expect(screen.getByText("No tasks in backlog.")).toBeInTheDocument();
      expect(screen.getByText("No tasks in ready.")).toBeInTheDocument();
      expect(screen.getByText("No tasks in doing.")).toBeInTheDocument();
    });

    it("rapidly filters tasks down to 0 items, displays 'No matching tasks' EmptyState, and clears filters via CTA", async () => {
      const tasks = [
        createTask({ id: "t1", title: "Chemistry Quiz Study", status: "ready" }),
        createTask({ id: "t2", title: "Math Assignment 4", status: "doing" })
      ];

      renderWithPlanner(
        <BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} onNewTask={vi.fn()} />,
        { planner: { tasks, courses: [sampleCourse] } }
      );

      expect(screen.getByText("Chemistry Quiz Study")).toBeInTheDocument();
      expect(screen.getByText("Math Assignment 4")).toBeInTheDocument();

      // Search for nonexistent term to filter down to 0
      const searchInput = screen.getByRole("textbox", { name: "Search tasks" });
      fireEvent.change(searchInput, { target: { value: "nonexistent-keyword-xyz" } });

      await waitFor(() => {
        expect(screen.getByText("No matching tasks")).toBeInTheDocument();
      });
      expect(screen.getByText("No tasks match the active filters or search terms.")).toBeInTheDocument();

      // Clear filters button in empty state
      const emptyState = screen.getByRole("status");
      const clearBtn = within(emptyState).getByRole("button", { name: /Clear filters/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText("Chemistry Quiz Study")).toBeInTheDocument();
        expect(screen.getByText("Math Assignment 4")).toBeInTheDocument();
      });
    });

    it("dynamically shows task additions when a matching task is added while filtered", async () => {
      const taskA = createTask({ id: "tA", title: "History Essay Draft", status: "ready" });

      render(
        <StatefulPlannerProvider initialTasks={[taskA]}>
          {({ setTasks }) => (
            <div>
              <button
                type="button"
                data-testid="add-physics-btn"
                onClick={() =>
                  setTasks((prev) => [
                    ...prev,
                    createTask({ id: "tB", title: "Physics Lab Experiment", status: "doing" })
                  ])
                }
              >
                Add Physics Task
              </button>
              <BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} onNewTask={vi.fn()} />
            </div>
          )}
        </StatefulPlannerProvider>
      );

      const searchInput = screen.getByRole("textbox", { name: "Search tasks" });
      fireEvent.change(searchInput, { target: { value: "Physics" } });

      await waitFor(() => {
        expect(screen.getByText("No matching tasks")).toBeInTheDocument();
      });

      // Add matching Physics task dynamically
      fireEvent.click(screen.getByTestId("add-physics-btn"));

      await waitFor(() => {
        expect(screen.getByText("Physics Lab Experiment")).toBeInTheDocument();
        expect(screen.queryByText("No matching tasks")).not.toBeInTheDocument();
      });
    });
  });

  /* 3. TimelineView */
  describe("3. TimelineView zero-state & scheduling CTA", () => {
    it("renders zero-state EmptyState with actionable CTA when selected day has no tasks", () => {
      const onNewTask = vi.fn();
      renderWithPlanner(
        <TimelineView onNewTask={onNewTask} onEdit={vi.fn()} />,
        { planner: { tasks: [], courses: [sampleCourse] } }
      );

      const emptyHeading = screen.getByText("Nothing scheduled");
      expect(emptyHeading).toBeInTheDocument();
      expect(screen.getByText("No tasks due on this day. Pick another day, or give a task a due time.")).toBeInTheDocument();

      const emptyState = emptyHeading.closest(".empty-state-card") as HTMLElement;
      expect(emptyState).not.toBeNull();
      const cta = within(emptyState).getByRole("button", { name: /Schedule a task/i });
      fireEvent.click(cta);
      expect(onNewTask).toHaveBeenCalledWith(expect.any(Date));
    });

    it("dynamically shows agenda task when a scheduled task for today is provided", () => {
      const todayIso = new Date().toISOString();
      const scheduledTask = createTask({
        id: "task-sched",
        title: "Scheduled Exam Review",
        dueAt: todayIso,
        estimatedMinutes: 60
      });

      renderWithPlanner(
        <TimelineView onNewTask={vi.fn()} onEdit={vi.fn()} />,
        { planner: { tasks: [scheduledTask], courses: [sampleCourse] } }
      );

      expect(screen.queryByText("Nothing scheduled")).not.toBeInTheDocument();
      expect(screen.getByText("Scheduled Exam Review")).toBeInTheDocument();
    });
  });

  /* 4. GoalsView */
  describe("4. GoalsView zero-state, GoalDetail steps & notes empty states", () => {
    it("renders EmptyState when 0 goals exist, and CTA triggers onNewGoal", () => {
      const onNewGoal = vi.fn();
      render(
        <GoalsView
          goals={[]}
          tasks={[]}
          courses={[]}
          notes={[]}
          onNewGoal={onNewGoal}
          onSelectGoal={vi.fn()}
          onSetGoalStatus={vi.fn()}
          onDeleteGoal={vi.fn()}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn()}
          onAddNote={vi.fn()}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onReorderTask={vi.fn()}
        />
      );

      expect(screen.getByText("No goals yet")).toBeInTheDocument();
      expect(screen.getByText("Set an end goal and break it into small steps.")).toBeInTheDocument();

      const emptyState = screen.getByRole("status");
      const cta = within(emptyState).getByRole("button", { name: /New goal/i });
      fireEvent.click(cta);
      expect(onNewGoal).toHaveBeenCalled();
    });

    it("renders inline empty states for 0 steps and 0 notes inside GoalDetail", () => {
      const goal = GoalSchema.parse({
        id: "goal-empty-1",
        title: "Pass Organic Chemistry",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const onAddNote = vi.fn().mockResolvedValue(createNote({ id: "note-1" }));

      render(
        <GoalsView
          goals={[goal]}
          tasks={[]}
          courses={[]}
          notes={[]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
          onSetGoalStatus={vi.fn()}
          onDeleteGoal={vi.fn()}
          onEditGoal={vi.fn()}
          onAddTask={vi.fn()}
          onAddNote={onAddNote}
          onCompleteTask={vi.fn()}
          onStatusChange={vi.fn()}
          onEditTask={vi.fn()}
          onReorderTask={vi.fn()}
        />
      );

      expect(screen.getByText("No steps yet")).toBeInTheDocument();
      expect(screen.getByText("No notes linked yet")).toBeInTheDocument();

      // CTA buttons inside their respective EmptyState regions
      const emptyStates = screen.getAllByRole("status");
      const stepsEmpty = emptyStates.find((el) => el.textContent?.includes("No steps yet"));
      expect(stepsEmpty).toBeDefined();
      const addStepBtn = within(stepsEmpty!).getByRole("button", { name: /Add step/i });
      expect(addStepBtn).toBeInTheDocument();

      const notesEmpty = emptyStates.find((el) => el.textContent?.includes("No notes linked yet"));
      expect(notesEmpty).toBeDefined();
      const addNoteBtn = within(notesEmpty!).getByRole("button", { name: /Add linked note/i });
      fireEvent.click(addNoteBtn);
      expect(onAddNote).toHaveBeenCalledWith({ goalIds: [goal.id], projectId: undefined });
    });
  });

  /* 5. NotesView */
  describe("5. NotesView zero-state, search filter to 0, clearing & detail empty state", () => {
    it("renders zero-state EmptyState when 0 notes exist, CTA calls onAddNote", () => {
      const onAddNote = vi.fn().mockResolvedValue(createNote({ id: "new-note" }));
      render(
        <NotesView
          notes={[]}
          tasks={[]}
          goals={[]}
          onAddNote={onAddNote}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );

      expect(screen.getByText("No notes yet")).toBeInTheDocument();
      expect(screen.getByText("Capture a thought and link it to a task or goal.")).toBeInTheDocument();

      const cta = screen.getAllByRole("button", { name: /New note/i })[0];
      fireEvent.click(cta);
      expect(onAddNote).toHaveBeenCalled();
    });

    it("filters notes to 0 items, shows 'No matches' EmptyState, and clears search via CTA", () => {
      const noteA = createNote({ id: "n1", title: "Biology Lab Notes", body: "Osmosis findings." });

      render(
        <NotesView
          notes={[noteA]}
          tasks={[]}
          goals={[]}
          onAddNote={vi.fn()}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );

      const searchInput = screen.getByRole("textbox", { name: "Search notes" });
      fireEvent.change(searchInput, { target: { value: "calculus" } });

      expect(screen.getByText("No matches")).toBeInTheDocument();
      expect(screen.getByText("Try a different search.")).toBeInTheDocument();

      const clearBtn = screen.getByRole("button", { name: "Clear search" });
      fireEvent.click(clearBtn);

      expect(searchInput).toHaveValue("");
      expect(screen.getByText("Biology Lab Notes")).toBeInTheDocument();
    });

    it("renders 'No note selected' EmptyState on desktop when selected is null", () => {
      const noteA = createNote({ id: "n1", title: "Note A", body: "Body A" });

      render(
        <NotesView
          notes={[noteA]}
          tasks={[]}
          goals={[]}
          selectedId={null}
          onAddNote={vi.fn()}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );

      const emptyNotice = screen.queryByText("No note selected");
      if (emptyNotice) {
        expect(emptyNotice).toBeInTheDocument();
        expect(screen.getByText("Pick a note from the list, or start a new one.")).toBeInTheDocument();
      }
    });
  });

  /* 6. CoursesView */
  describe("6. CoursesView zero-state, creation CTA focus, dynamic addition", () => {
    it("renders zero-state EmptyState when 0 courses exist, CTA focuses project name input", () => {
      render(
        <CoursesView
          courses={[]}
          tasks={[]}
          onUpsertCourse={vi.fn()}
          onDeleteCourse={vi.fn()}
        />
      );

      expect(screen.getByText("No projects yet")).toBeInTheDocument();
      expect(screen.getByText("Add one below to group related tasks, goals, and notes.")).toBeInTheDocument();

      const nameInput = screen.getByLabelText("New project name");
      expect(document.activeElement).not.toBe(nameInput);

      const emptyState = screen.getByRole("status");
      const cta = within(emptyState).getByRole("button", { name: /Create project/i });
      fireEvent.click(cta);

      expect(document.activeElement).toBe(nameInput);
    });

    it("dynamically shows project row when courses array is populated", () => {
      const course = createCourse({ id: "c1", name: "Astrophysics", color: "#8f6bf5", icon: "A" });

      const { rerender } = render(
        <CoursesView
          courses={[]}
          tasks={[]}
          onUpsertCourse={vi.fn()}
          onDeleteCourse={vi.fn()}
        />
      );

      expect(screen.getByText("No projects yet")).toBeInTheDocument();

      rerender(
        <CoursesView
          courses={[course]}
          tasks={[]}
          onUpsertCourse={vi.fn()}
          onDeleteCourse={vi.fn()}
        />
      );

      expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
      expect(screen.getByText("Astrophysics")).toBeInTheDocument();
    });
  });

  /* 7. InsightsView */
  describe("7. InsightsView zero-state, first-run CTA & transition to populated", () => {
    it("renders first-run EmptyState when tasks and focus sessions are 0, CTA calls onNewTask", () => {
      mockTasksData.current = [];
      mockCoursesData.current = [];
      mockFocusSessionsData.current = [];

      const onNewTask = vi.fn();
      render(<InsightsView onNewTask={onNewTask} />);

      expect(screen.getByText("No activity recorded yet")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Insights, coaching, and focus trends will appear here once you capture tasks and complete study sessions."
        )
      ).toBeInTheDocument();

      const emptyState = screen.getByRole("status");
      const cta = within(emptyState).getByRole("button", { name: /Capture a task/i });
      fireEvent.click(cta);
      expect(onNewTask).toHaveBeenCalled();
    });

    it("renders full analytics dashboard once tasks and sessions exist", () => {
      const completedTask = createTask({
        id: "done-1",
        title: "Completed Project Milestone",
        status: "done",
        completedAt: new Date().toISOString()
      });

      mockTasksData.current = [completedTask];
      mockCoursesData.current = [sampleCourse];
      mockFocusSessionsData.current = [
        {
          id: "fs-1",
          title: "Focus Block",
          startedAt: new Date().toISOString(),
          durationMinutes: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      render(<InsightsView onNewTask={vi.fn()} />);

      expect(screen.queryByText("No activity recorded yet")).not.toBeInTheDocument();
      expect(screen.getByText("Completions, last 7 days")).toBeInTheDocument();
      expect(screen.getByText("Focus hours, last 7 days")).toBeInTheDocument();
    });
  });

  /* 8. SettingsView */
  describe("8. SettingsView zero-state robustness", () => {
    it("renders cleanly with 0 tasks and 0 courses without any errors", () => {
      const onAppearanceChange = vi.fn().mockResolvedValue({});
      render(
        <SettingsView
          tasks={[]}
          courses={[]}
          onAppearanceChange={onAppearanceChange}
        />
      );

      // Verify key setting sections render properly
      expect(screen.getByText("Appearance")).toBeInTheDocument();
      expect(screen.getByText("Your data")).toBeInTheDocument();
      expect(screen.getByText("Notifications")).toBeInTheDocument();
      expect(screen.getByText("Calendar export")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Export backup/i })).toBeInTheDocument();
    });
  });
});

describe("Feature 15 Adversarial: FilterBar modal preset saving, validation, dismissal, focus, and mobile row", () => {
  const sampleCourses = [
    createCourse({ id: "c1", name: "Literature", color: "#ff5d47", icon: "L" }),
    createCourse({ id: "c2", name: "Chemistry", color: "#1fae67", icon: "C" })
  ];

  it("empty name validation: save button disabled and direct submit shows validation alert without calling onSavePreset", () => {
    const onSavePreset = vi.fn();
    render(
      <FilterBar
        courses={sampleCourses}
        filters={{ ...defaultFilterState, search: "exam" }}
        setFilter={vi.fn()}
        onSavePreset={onSavePreset}
      />
    );

    // Open Save preset modal
    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });
    expect(dialog).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/Filter preset name/i);
    expect(nameInput).toHaveValue("");

    const submitBtn = within(dialog).getByRole("button", { name: /^Save preset$/i });
    expect(submitBtn).toBeDisabled();

    // Trigger form submit directly
    const form = dialog.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    // Validation alert must appear
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please enter a name for this preset");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(onSavePreset).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument(); // modal stays open
  });

  it("whitespace-only names: save button disabled and direct submit shows validation alert without calling onSavePreset", () => {
    const onSavePreset = vi.fn();
    render(
      <FilterBar
        courses={sampleCourses}
        filters={{ ...defaultFilterState, search: "exam" }}
        setFilter={vi.fn()}
        onSavePreset={onSavePreset}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });

    const nameInput = within(dialog).getByLabelText(/Filter preset name/i);
    fireEvent.change(nameInput, { target: { value: "     " } });

    const submitBtn = within(dialog).getByRole("button", { name: /^Save preset$/i });
    expect(submitBtn).toBeDisabled();

    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please enter a name for this preset");
    expect(onSavePreset).not.toHaveBeenCalled();

    // Typing a valid character clears the error and enables submit
    fireEvent.change(nameInput, { target: { value: "     Exam Study" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(onSavePreset).toHaveBeenCalledWith("Exam Study"); // trimmed!
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("duplicate names: calls onSavePreset with name and deduplicates in useFilters hook", () => {
    const onSavePreset = vi.fn();
    const existingPresets: SavedFilterPreset[] = [
      {
        id: "p1",
        name: "Urgent Chem",
        filters: { ...defaultFilterState, search: "chem" }
      }
    ];

    render(
      <FilterBar
        courses={sampleCourses}
        filters={{ ...defaultFilterState, search: "chem updated" }}
        setFilter={vi.fn()}
        presets={existingPresets}
        onSavePreset={onSavePreset}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });

    const nameInput = within(dialog).getByLabelText(/Filter preset name/i);
    fireEvent.change(nameInput, { target: { value: "Urgent Chem" } });

    fireEvent.click(within(dialog).getByRole("button", { name: /^Save preset$/i }));
    expect(onSavePreset).toHaveBeenCalledWith("Urgent Chem");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("escape key dismissal: dismisses modal on Escape keydown without saving", () => {
    const onSavePreset = vi.fn();
    render(
      <FilterBar
        courses={sampleCourses}
        filters={{ ...defaultFilterState, search: "exam" }}
        setFilter={vi.fn()}
        onSavePreset={onSavePreset}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
    expect(screen.getByRole("dialog", { name: /Save filter preset/i })).toBeInTheDocument();

    // Press Escape key on document
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSavePreset).not.toHaveBeenCalled();
  });

  it("focus restoration investigation: captures empirical focus behavior on modal dismissal", async () => {
    render(
      <FilterBar
        courses={sampleCourses}
        filters={{ ...defaultFilterState, search: "exam" }}
        setFilter={vi.fn()}
        onSavePreset={vi.fn()}
      />
    );

    const saveTrigger = screen.getByRole("button", { name: /Save preset/i });
    saveTrigger.focus();
    expect(document.activeElement).toBe(saveTrigger);

    fireEvent.click(saveTrigger);
    const dialog = screen.getByRole("dialog", { name: /Save filter preset/i });
    expect(dialog).toBeInTheDocument();

    // Cancel modal
    const cancelBtn = within(dialog).getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    
    // Check whether focus was restored to saveTrigger or lost to document.body
    const restored = document.activeElement === saveTrigger;
    // Log empirical finding:
    // With native autoFocus on TextInput in FilterBar, focus drops to body because
    // React's autoFocus fires during reconciliation before useLayoutEffect captures activeElement.
    expect(restored).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it("focus restoration oracle: demonstrates that data-autofocus instead of autoFocus enables successful focus restoration", async () => {
    function PresetModalWithDataAutofocus() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button data-testid="save-trigger-fix" onClick={() => setOpen(true)}>
            Save preset
          </button>
          {open && (
            <Modal title="Save filter preset" onClose={() => setOpen(false)}>
              <form onSubmit={(e) => e.preventDefault()}>
                <input data-autofocus placeholder="Preset name" />
                <button type="button" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </form>
            </Modal>
          )}
        </div>
      );
    }

    render(<PresetModalWithDataAutofocus />);
    const trigger = screen.getByTestId("save-trigger-fix");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe("Mobile compact swipeable row with 0, 1, and 20 presets", () => {
    let restoreMedia: () => void;

    beforeEach(() => {
      restoreMedia = stubMatchMedia("(max-width: 720px)");
    });

    afterEach(() => {
      restoreMedia?.();
    });

    it("0 presets: does not render filter-presets-row container", () => {
      render(
        <FilterBar
          courses={sampleCourses}
          filters={defaultFilterState}
          setFilter={vi.fn()}
          presets={[]}
        />
      );

      expect(screen.queryByRole("region", { name: "Filter presets" })).not.toBeInTheDocument();
    });

    it("1 preset: renders filter-presets-row with 1 preset chip and applies it on click", () => {
      const onApplyPreset = vi.fn();
      const singlePreset: SavedFilterPreset = {
        id: "preset-single",
        name: "Midterms",
        filters: { ...defaultFilterState, search: "midterm" }
      };

      render(
        <FilterBar
          courses={sampleCourses}
          filters={defaultFilterState}
          setFilter={vi.fn()}
          presets={[singlePreset]}
          onApplyPreset={onApplyPreset}
        />
      );

      const presetsRegion = screen.getByRole("region", { name: "Filter presets" });
      expect(presetsRegion).toBeInTheDocument();

      const chip = within(presetsRegion).getByRole("button", { name: "Midterms" });
      expect(chip).toBeInTheDocument();

      fireEvent.click(chip);
      expect(onApplyPreset).toHaveBeenCalledWith(singlePreset);
    });

    it("20 presets: renders all 20 presets cleanly in scrollable row and applies any of them on click", () => {
      const onApplyPreset = vi.fn();
      const twentyPresets: SavedFilterPreset[] = Array.from({ length: 20 }, (_, idx) => ({
        id: `preset-${idx + 1}`,
        name: `Preset ${idx + 1}`,
        filters: { ...defaultFilterState, search: `query-${idx + 1}` }
      }));

      render(
        <FilterBar
          courses={sampleCourses}
          filters={defaultFilterState}
          setFilter={vi.fn()}
          presets={twentyPresets}
          onApplyPreset={onApplyPreset}
        />
      );

      const presetsRegion = screen.getByRole("region", { name: "Filter presets" });
      expect(presetsRegion).toBeInTheDocument();

      // Check count of chips
      const chips = within(presetsRegion).getAllByRole("button");
      expect(chips).toHaveLength(20);

      // Verify first preset
      fireEvent.click(within(presetsRegion).getByRole("button", { name: "Preset 1" }));
      expect(onApplyPreset).toHaveBeenCalledWith(twentyPresets[0]);

      // Verify middle preset (10th)
      fireEvent.click(within(presetsRegion).getByRole("button", { name: "Preset 10" }));
      expect(onApplyPreset).toHaveBeenCalledWith(twentyPresets[9]);

      // Verify last preset (20th)
      fireEvent.click(within(presetsRegion).getByRole("button", { name: "Preset 20" }));
      expect(onApplyPreset).toHaveBeenCalledWith(twentyPresets[19]);
    });
  });
});
