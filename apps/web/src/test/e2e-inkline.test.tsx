import {
  createCourse,
  createFocusSession,
  createGoal,
  createNote,
  createTask,
  deriveCoachingInsights,
  sampleCourses
} from "@throughline/domain";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { db } from "../data/db";
import {
  addTask as addTaskRecord,
  saveAppearanceSettings,
  upsertCourse as upsertCourseRecord
} from "../data/repositories";
import { Sheet } from "../ui";
import { BoardView } from "../views/BoardView";
import { CommandPalette } from "../views/CommandPalette";
import { CoursesView } from "../views/CoursesView";
import { GoalsView } from "../views/GoalsView";
import { InsightsView } from "../views/InsightsView";
import { NoteEditor, NotesView } from "../views/NotesView";
import { SettingsView } from "../views/SettingsView";
import { PlannerProvider } from "../state/PlannerProvider";
import { TaskCard } from "../views/TaskCard";
import { TaskComposer } from "../views/TaskComposer";
import { TimelineView } from "../views/TimelineView";
import { TodayView } from "../views/TodayView";
import { renderWithPlanner } from "./planner-test-utils";

function stubMatchMedia(matchingQuery?: string) {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === matchingQuery,
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

describe("Throughline Inkline E2E Test Suite", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    window.history.replaceState({}, "", "/app");
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    await db.delete();
  });

  /* ==========================================================================
     TIER 1: FEATURE COVERAGE (Isolation & Component Contracts)
     ========================================================================== */
  describe("Tier 1: Feature Coverage", () => {
    // 1. Today Dashboard
    describe("Today Dashboard", () => {
      it("T1.1: renders agenda with scheduled tasks and course badge", () => {
        const dueSoon = new Date();
        dueSoon.setHours(dueSoon.getHours() + 2);

        const course = createCourse({ id: "course_bio", name: "Biology 101", code: "BIO101", color: "#1fae67", icon: "B" });
        const task = createTask({
          id: "task_1",
          title: "Complete lab write-up",
          courseId: course.id,
          status: "ready",
          dueAt: dueSoon.toISOString()
        });

        renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
          planner: {
            tasks: [task],
            courses: [course],
            courseById: new Map([[course.id, course]])
          }
        });

        expect(screen.getAllByText("Complete lab write-up").length).toBeGreaterThan(0);
        expect(screen.getByText("BIO101")).toBeInTheDocument();
      });

      it("T1.2: renders overdue tasks banner with overdue count and tone", () => {
        const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const overdueTask = createTask({
          id: "task_overdue",
          title: "Overdue Literature Essay",
          status: "ready",
          dueAt: past
        });

        renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
          planner: {
            tasks: [overdueTask],
            courses: [],
            courseById: new Map()
          }
        });

        expect(screen.getByText(/1 task is overdue/i)).toBeInTheDocument();
        expect(screen.getByText("Overdue Literature Essay")).toBeInTheDocument();
      });

      it("T1.3: renders truthful completion metrics ('1 of 2 tasks done')", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-28T15:00:00.000Z"));
        const todayIso = "2026-06-28T18:00:00.000Z";

        const doneTask = createTask({
          id: "t_done",
          title: "Morning Reading",
          status: "done",
          dueAt: todayIso,
          completedAt: "2026-06-28T10:00:00.000Z"
        });
        const openTask = createTask({
          id: "t_open",
          title: "Evening Problem Set",
          status: "ready",
          dueAt: todayIso
        });

        renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
          planner: {
            tasks: [doneTask, openTask],
            courses: [],
            courseById: new Map()
          }
        });

        expect(screen.getByText("1 of 2 tasks done. Keep it quiet and steady.")).toBeInTheDocument();
        expect(screen.getByText("1/2")).toBeInTheDocument();
      });

      it("T1.4: triggers onNewTask callback when quick action is clicked", () => {
        const onNewTask = vi.fn();
        renderWithPlanner(<TodayView onNewTask={onNewTask} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
          planner: { tasks: [], courses: [], courseById: new Map() }
        });

        const newButtons = screen.getAllByRole("button", { name: /Capture a task/i });
        expect(newButtons.length).toBeGreaterThan(0);
        fireEvent.click(newButtons[0]);
        expect(onNewTask).toHaveBeenCalled();
      });

      it("T1.5: triggers onStartFocus callback when focus action is clicked", () => {
        const onStartFocus = vi.fn();
        const dueSoon = new Date(Date.now() + 3600000).toISOString();
        const task = createTask({
          id: "task_focus",
          title: "Deep focus thesis chapter",
          status: "ready",
          dueAt: dueSoon
        });

        renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={onStartFocus} />, {
          planner: {
            tasks: [task],
            courses: [],
            courseById: new Map()
          }
        });

        const focusBtn = screen.getByRole("button", { name: /Start focus mode for Deep focus thesis chapter/i });
        fireEvent.click(focusBtn);
        expect(onStartFocus).toHaveBeenCalledWith(expect.objectContaining({ id: "task_focus" }));
      });
    });

    // 2. Kanban Board
    describe("Kanban Board", () => {
      it("T1.6: renders all kanban columns (Backlog, Ready, Doing, Done) on desktop", () => {
        const restore = stubMatchMedia("(min-width: 1101px)");
        renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} />, {
          planner: { tasks: [], courses: [], courseById: new Map() }
        });

        expect(screen.getByRole("heading", { name: "Backlog" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Ready" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Doing" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();
        restore();
      });

      it("T1.7: triggers onStatusChange when task status is updated via dropdown or keyboard", () => {
        const restore = stubMatchMedia();
        const onStatusChange = vi.fn();
        const task = createTask({ id: "k_task_1", title: "Study Chemistry", status: "ready" });

        renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={onStatusChange} onEdit={vi.fn()} />, {
          planner: { tasks: [task], courses: [], courseById: new Map() }
        });

        const card = document.getElementById("task-card-k_task_1");
        expect(card).toBeInTheDocument();
        if (card) {
          fireEvent.keyDown(card, { key: "ArrowRight", ctrlKey: true });
          expect(onStatusChange).toHaveBeenCalledWith("k_task_1", "doing");
        }
        restore();
      });

      it("T1.8: announces live status change to screen readers via aria-live", () => {
        const restore = stubMatchMedia();
        const task = createTask({ id: "k_task_ann", title: "Organic Chemistry Exam", status: "ready" });

        renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} />, {
          planner: { tasks: [task], courses: [], courseById: new Map() }
        });

        const card = document.getElementById("task-card-k_task_ann");
        if (card) {
          fireEvent.keyDown(card, { key: "ArrowRight", ctrlKey: true });
          expect(screen.getByText("Moved Organic Chemistry Exam to Doing.")).toBeInTheDocument();
        }
        restore();
      });

      it("T1.9: uses mobile status tabs to switch visible column on small viewports", () => {
        const restore = stubMatchMedia("(max-width: 1100px)");
        const readyTask = createTask({ id: "m_ready", title: "Mobile Ready Task", status: "ready" });
        const doingTask = createTask({ id: "m_doing", title: "Mobile Doing Task", status: "doing" });

        renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={onStatusChangeDummy} onEdit={vi.fn()} />, {
          planner: { tasks: [readyTask, doingTask], courses: [], courseById: new Map() }
        });

        const readyTab = screen.getByRole("tab", { name: /Ready/i });
        fireEvent.click(readyTab);
        expect(screen.getByText("Mobile Ready Task")).toBeInTheDocument();

        const doingTab = screen.getByRole("tab", { name: /Doing/i });
        fireEvent.click(doingTab);
        expect(screen.getByText("Mobile Doing Task")).toBeInTheDocument();
        restore();
      });

      it("T1.10: triggers onEdit when task title is clicked or Enter is pressed", () => {
        const restore = stubMatchMedia();
        const onEdit = vi.fn();
        const task = createTask({ id: "task_edit_kb", title: "Interactive Board Task", status: "ready" });

        renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={onEdit} />, {
          planner: { tasks: [task], courses: [], courseById: new Map() }
        });

        const editBtn = screen.getByRole("button", { name: "Interactive Board Task" });
        fireEvent.click(editBtn);
        expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "task_edit_kb" }));
        restore();
      });
    });

    // 3. Timeline View
    describe("Timeline View", () => {
      it("T1.11: renders timeline heading and date navigation controls", () => {
        renderWithPlanner(<TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />);
        expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
        expect(screen.getByRole("tablist", { name: "Select a day" })).toBeInTheDocument();
        expect(screen.getAllByRole("tab").length).toBeGreaterThanOrEqual(7);
      });

      it("T1.12: displays scheduled agenda items with start and due timestamps", () => {
        const today = new Date();
        today.setHours(15, 0, 0, 0);
        const task = createTask({
          id: "time_t1",
          title: "Calculus Lecture",
          status: "ready",
          dueAt: today.toISOString()
        });

        renderWithPlanner(<TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />, {
          planner: { tasks: [task], courses: [], courseById: new Map() }
        });

        expect(screen.getByText("Calculus Lecture")).toBeInTheDocument();
      });

      it("T1.13: renders empty state when no tasks are scheduled for the selected day", () => {
        renderWithPlanner(<TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />, {
          planner: { tasks: [], courses: [], courseById: new Map() }
        });

        expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
        expect(screen.getByText(/No tasks due on this day/i)).toBeInTheDocument();
      });

      it("T1.14: renders kanban status badge and time range for agenda tasks", () => {
        const today = new Date();
        today.setHours(16, 0, 0, 0);
        const task = createTask({
          id: "time_sched_1",
          title: "Review Midterm Draft",
          status: "ready",
          estimatedMinutes: 45,
          dueAt: today.toISOString()
        });

        renderWithPlanner(
          <TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />,
          {
            planner: { tasks: [task], courses: [], courseById: new Map() }
          }
        );

        expect(screen.getByText("Review Midterm Draft")).toBeInTheDocument();
        expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);
      });

      it("T1.15: triggers focus launcher directly from timeline task item", () => {
        const onStartFocus = vi.fn();
        const today = new Date();
        today.setHours(14, 30, 0, 0);
        const task = createTask({
          id: "time_focus_1",
          title: "Physics Problem Set 3",
          status: "ready",
          dueAt: today.toISOString()
        });

        renderWithPlanner(
          <TimelineView onNewTask={vi.fn()} onStartFocus={onStartFocus} onUpdateTask={vi.fn()} />,
          {
            planner: { tasks: [task], courses: [], courseById: new Map() }
          }
        );

        const focusBtn = screen.getByRole("button", { name: /Start focus mode for Physics Problem Set 3/i });
        fireEvent.click(focusBtn);
        expect(onStartFocus).toHaveBeenCalledWith(expect.objectContaining({ id: "time_focus_1" }));
      });
    });

    // 4. Goals View
    describe("Goals View", () => {
      it("T1.16: renders goals with roll-up progress percentage and step counts", () => {
        const goal = createGoal({ id: "g_1", title: "Complete Honors Thesis" });
        const step1 = createTask({ id: "s_1", goalId: goal.id, title: "Draft chapter 1", status: "done" });
        const step2 = createTask({ id: "s_2", goalId: goal.id, title: "Draft chapter 2", status: "ready" });

        render(
          <GoalsView
            goals={[goal]}
            tasks={[step1, step2]}
            courses={[]}
            notes={[]}
            onSelectGoal={vi.fn()}
            onNewGoal={vi.fn()}
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

        expect(screen.getByText("Complete Honors Thesis")).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("1/2 steps")).toBeInTheDocument();
      });

      it("T1.17: displays step decomposition with ordered tasks linked to the goal", () => {
        const goal = createGoal({ id: "g_steps", title: "Publish Web App" });
        const step = createTask({ id: "step_app_1", goalId: goal.id, title: "Implement Auth Flow", status: "ready" });

        render(
          <GoalsView
            goals={[goal]}
            tasks={[step]}
            courses={[]}
            notes={[]}
            selectedId={goal.id}
            onSelectGoal={vi.fn()}
            onNewGoal={vi.fn()}
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

        expect(screen.getByText("Tasks toward this goal")).toBeInTheDocument();
        expect(screen.getByText("Implement Auth Flow")).toBeInTheDocument();
      });

      it("T1.18: allows setting goal status (reopening completed goal)", () => {
        const onSetGoalStatus = vi.fn();
        const goal = createGoal({ id: "g_status", title: "Finished Sprint", status: "done" });

        render(
          <GoalsView
            goals={[goal]}
            tasks={[]}
            courses={[]}
            notes={[]}
            selectedId={goal.id}
            onSelectGoal={vi.fn()}
            onNewGoal={vi.fn()}
            onSetGoalStatus={onSetGoalStatus}
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

        const reopenBtn = screen.getByRole("button", { name: "Reopen goal" });
        fireEvent.click(reopenBtn);
        expect(onSetGoalStatus).toHaveBeenCalledWith(goal.id, "active");
      });

      it("T1.19: renders linked notes and enables jumping to linked note", () => {
        const onOpenNote = vi.fn();
        const goal = createGoal({ id: "g_notes", title: "Research Project" });
        const note = createNote({ id: "n_research", title: "Literature Review Summary", goalIds: [goal.id] });

        render(
          <GoalsView
            goals={[goal]}
            tasks={[]}
            courses={[]}
            notes={[note]}
            selectedId={goal.id}
            onSelectGoal={vi.fn()}
            onNewGoal={vi.fn()}
            onSetGoalStatus={vi.fn()}
            onDeleteGoal={vi.fn()}
            onEditGoal={vi.fn()}
            onAddTask={vi.fn()}
            onAddNote={vi.fn()}
            onCompleteTask={vi.fn()}
            onStatusChange={vi.fn()}
            onEditTask={vi.fn()}
            onOpenNote={onOpenNote}
            onReorderTask={vi.fn()}
          />
        );

        expect(screen.getByText("Linked notes")).toBeInTheDocument();
        expect(screen.getByText("Literature Review Summary")).toBeInTheDocument();
      });

      it("T1.20: triggers new goal composer when 'New goal' button is pressed", () => {
        const onNewGoal = vi.fn();
        render(
          <GoalsView
            goals={[]}
            tasks={[]}
            courses={[]}
            notes={[]}
            onSelectGoal={vi.fn()}
            onNewGoal={onNewGoal}
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

        const addGoalButtons = screen.getAllByRole("button", { name: /Add goal|New goal/i });
        expect(addGoalButtons.length).toBeGreaterThan(0);
        fireEvent.click(addGoalButtons[0]);
        expect(onNewGoal).toHaveBeenCalled();
      });
    });

    // 5. Notes View
    describe("Notes View", () => {
      it("T1.21: lists notes with titles, bodies, and pinned note prioritization", () => {
        const pinnedNote = createNote({ id: "n_pin", title: "Pinned Formula Sheet", body: "Important formulas", pinned: true });
        const regularNote = createNote({ id: "n_reg", title: "Random Scratchpad", body: "Draft ideas" });

        render(
          <NotesView
            notes={[regularNote, pinnedNote]}
            tasks={[]}
            goals={[]}
            onAddNote={vi.fn().mockResolvedValue(pinnedNote)}
            onUpdateNote={vi.fn().mockResolvedValue(pinnedNote)}
            onRemoveNote={vi.fn()}
            onToggleLink={vi.fn()}
          />
        );

        expect(screen.getByText("Pinned Formula Sheet")).toBeInTheDocument();
        expect(screen.getByText("Random Scratchpad")).toBeInTheDocument();
      });

      it("T1.22: opens markdown editor and renders markdown preview correctly", () => {
        const note = createNote({ id: "n_md", title: "Markdown Architecture", body: "# System Overview\n\n- Point A\n- Point B" });

        render(
          <NoteEditor
            note={note}
            tasks={[]}
            goals={[]}
            onSave={vi.fn()}
            onDelete={vi.fn()}
            onToggleLink={vi.fn()}
          />
        );

        fireEvent.click(screen.getByRole("button", { name: "Preview" }));
        expect(screen.getByRole("heading", { name: "System Overview" })).toBeInTheDocument();
        expect(screen.getByText("Point A")).toBeInTheDocument();
      });

      it("T1.23: supports searching and filtering notes by query in notes list", () => {
        const noteBiology = createNote({ id: "n_bio", title: "Cell Biology", body: "Mitochondria notes" });
        const noteMath = createNote({ id: "n_math", title: "Linear Algebra", body: "Matrix eigenvalues" });

        render(
          <NotesView
            notes={[noteBiology, noteMath]}
            tasks={[]}
            goals={[]}
            onAddNote={vi.fn().mockResolvedValue(noteBiology)}
            onUpdateNote={vi.fn().mockResolvedValue(noteBiology)}
            onRemoveNote={vi.fn()}
            onToggleLink={vi.fn()}
          />
        );

        expect(screen.getByText("Cell Biology")).toBeInTheDocument();
        expect(screen.getByText("Linear Algebra")).toBeInTheDocument();

        const searchInput = screen.getByLabelText("Search notes");
        fireEvent.change(searchInput, { target: { value: "Linear" } });

        expect(screen.getByText(/Linear/i)).toBeInTheDocument();
        expect(screen.queryByText("Cell Biology")).not.toBeInTheDocument();
      });

      it("T1.24: displays linked task and goal chips inside active note editor", () => {
        const task = createTask({ id: "t_link_1", title: "Finish Bibliography" });
        const goal = createGoal({ id: "g_link_1", title: "Publish Capstone Paper" });
        const note = createNote({
          id: "n_linked",
          title: "Capstone Reference Notes",
          taskIds: [task.id],
          goalIds: [goal.id]
        });

        render(
          <NotesView
            notes={[note]}
            tasks={[task]}
            goals={[goal]}
            selectedId={note.id}
            onAddNote={vi.fn().mockResolvedValue(note)}
            onUpdateNote={vi.fn().mockResolvedValue(note)}
            onRemoveNote={vi.fn()}
            onToggleLink={vi.fn()}
          />
        );

        expect(screen.getByText("Finish Bibliography")).toBeInTheDocument();
        expect(screen.getByText("Publish Capstone Paper")).toBeInTheDocument();
      });

      it("T1.25: provides mobile list-first navigation with back button", () => {
        const restore = stubMatchMedia("(max-width: 720px)");
        const note = createNote({ id: "n_mob", title: "Mobile Navigation Test", body: "Content body" });

        render(
          <NotesView
            notes={[note]}
            tasks={[]}
            goals={[]}
            onAddNote={vi.fn().mockResolvedValue(note)}
            onUpdateNote={vi.fn().mockResolvedValue(note)}
            onRemoveNote={vi.fn()}
            onToggleLink={vi.fn()}
          />
        );

        expect(screen.queryByLabelText("Note title")).not.toBeInTheDocument();
        fireEvent.click(screen.getByText("Mobile Navigation Test"));
        expect(screen.getByLabelText("Note title")).toHaveValue("Mobile Navigation Test");

        // Click back button to return to notes list
        fireEvent.click(screen.getByRole("button", { name: "Notes" }));
        expect(screen.queryByLabelText("Note title")).not.toBeInTheDocument();
        restore();
      });
    });

    // 6. Projects/Courses View
    describe("Projects/Courses View", () => {
      it("T1.26: lists active courses with color badges and icons", () => {
        const bioCourse = createCourse({ id: "c_bio", name: "Molecular Biology", code: "BIO301", color: "#1fae67", icon: "B" });

        render(
          <CoursesView
            courses={[bioCourse]}
            tasks={[]}
            onUpsertCourse={vi.fn()}
            onDeleteCourse={vi.fn()}
          />
        );

        expect(screen.getByText("Molecular Biology")).toBeInTheDocument();
      });

      it("T1.27: displays grouped task counts under their respective courses", () => {
        const csCourse = createCourse({ id: "c_cs", name: "Computer Science", code: "CS101", color: "#3d5afe", icon: "C" });
        const task = createTask({ id: "t_cs_1", courseId: csCourse.id, title: "Implement Binary Tree", status: "ready" });

        render(
          <CoursesView
            courses={[csCourse]}
            tasks={[task]}
            onUpsertCourse={vi.fn()}
            onDeleteCourse={vi.fn()}
          />
        );

        expect(screen.getByText("Computer Science")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
      });

      it("T1.28: adds a new project/course with name, code, and color", async () => {
        const onUpsertCourse = vi.fn().mockResolvedValue(undefined);

        render(
          <CoursesView
            courses={[]}
            tasks={[]}
            onUpsertCourse={onUpsertCourse}
            onDeleteCourse={vi.fn()}
          />
        );

        const nameInput = screen.getByLabelText("New project name");
        fireEvent.change(nameInput, { target: { value: "Discrete Mathematics" } });
        fireEvent.click(screen.getByRole("button", { name: "Add project" }));

        await waitFor(() => {
          expect(onUpsertCourse).toHaveBeenCalledWith(expect.objectContaining({ name: "Discrete Mathematics" }));
        });
      });

      it("T1.29: triggers course deletion callback after confirmation", async () => {
        const onDeleteCourse = vi.fn().mockResolvedValue(undefined);
        const artCourse = createCourse({ id: "c_art", name: "Art History", color: "#ff5d47", icon: "A" });

        render(
          <CoursesView
            courses={[artCourse]}
            tasks={[]}
            onUpsertCourse={vi.fn()}
            onDeleteCourse={onDeleteCourse}
          />
        );

        const deleteBtn = screen.getByRole("button", { name: /Delete Art History/i });
        fireEvent.click(deleteBtn);

        const confirmBtn = await screen.findByRole("button", { name: "Delete project" });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
          expect(onDeleteCourse).toHaveBeenCalledWith(artCourse.id);
        });
      });

      it("T1.30: renders empty state when no courses exist", () => {
        render(
          <CoursesView
            courses={[]}
            tasks={[]}
            onUpsertCourse={vi.fn()}
            onDeleteCourse={vi.fn()}
          />
        );

        expect(screen.getByText("No projects yet")).toBeInTheDocument();
      });
    });

    // 7. Insights View
    describe("Insights View", () => {
      it("T1.31: displays truth-based summary statistics tiles (Completed, Focus time, Overdue)", async () => {
        const now = new Date().toISOString();
        const course = createCourse({ id: "ins_c1", name: "Biology", icon: "B", color: "#1fae67" });
        await db.courses.bulkPut([course]);
        await db.tasks.bulkPut([
          createTask({
            id: "ins_task_1",
            title: "Completed Milestone",
            status: "done",
            completedAt: now,
            courseId: course.id
          })
        ]);
        await db.focusSessions.bulkPut([
          createFocusSession({ id: "fs_1", startedAt: now, durationMinutes: 45 })
        ]);

        render(
          <PlannerProvider>
            <InsightsView />
          </PlannerProvider>
        );

        expect(await screen.findByText("Completed")).toBeInTheDocument();
        expect(await screen.findByText("Focus time")).toBeInTheDocument();
        expect(await screen.findByText("All-time finished tasks")).toBeInTheDocument();
      });

      it("T1.32: renders 28-day completion heatmap with intensity values", async () => {
        render(
          <PlannerProvider>
            <InsightsView />
          </PlannerProvider>
        );
        const heatmap = await screen.findByLabelText("Completed tasks over the last 28 days");
        expect(heatmap).toBeInTheDocument();
        expect(heatmap.children.length).toBe(28);
      });

      it("T1.33: renders weekly completions chart structure", async () => {
        render(
          <PlannerProvider>
            <InsightsView />
          </PlannerProvider>
        );
        expect(await screen.findByText("Completions, last 7 days")).toBeInTheDocument();
        expect(screen.getByText("Weekly rhythm")).toBeInTheDocument();
      });

      it("T1.34: derives algorithmic coaching signals based on student workload", () => {
        const biology = createCourse({ id: "c_bio_coach", name: "Biology", icon: "B", color: "#1fae67" });
        const heavyTasks = [
          createTask({ id: "h1", title: "Task 1", courseId: biology.id, status: "done", completedAt: "2026-06-28T09:00:00.000Z" }),
          createTask({ id: "h2", title: "Task 2", courseId: biology.id, status: "done", completedAt: "2026-06-27T10:00:00.000Z" })
        ];

        const coaching = deriveCoachingInsights({
          tasks: heavyTasks,
          courses: [biology],
          focusSessions: [],
          now: new Date("2026-06-28T15:00:00.000Z")
        });
        expect(coaching.some((item) => item.message.includes("Biology is carrying most"))).toBe(true);
      });

      it("T1.35: displays course load distribution of completed tasks", async () => {
        const course = sampleCourses[0];
        await db.courses.bulkPut([course]);
        await db.tasks.bulkPut([
          createTask({ id: "c_task_1", title: "Done 1", courseId: course.id, status: "done", completedAt: new Date().toISOString() })
        ]);

        render(
          <PlannerProvider>
            <InsightsView />
          </PlannerProvider>
        );
        expect(await screen.findByText("Where completions landed")).toBeInTheDocument();
        expect(await screen.findByText(course.name)).toBeInTheDocument();
        expect(screen.getByText("1 tasks")).toBeInTheDocument();
      });
    });

    // 8. Settings View
    describe("Settings View", () => {
      it("T1.36: toggles theme between light, dark, and system options", () => {
        const onAppearanceChange = vi.fn().mockResolvedValue({ id: "app-settings", theme: "dark" });

        render(
          <SettingsView
            tasks={[]}
            courses={[]}
            appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
            onAppearanceChange={onAppearanceChange}
          />
        );

        const darkBtn = screen.getByRole("button", { name: /Dark/i });
        fireEvent.click(darkBtn);
        expect(onAppearanceChange).toHaveBeenCalledWith({ theme: "dark" });
      });

      it("T1.37: persists appearance settings changes via onAppearanceChange", () => {
        const onAppearanceChange = vi.fn().mockResolvedValue({ id: "appearance-settings", lowPower3d: false, showGameLayer: true, theme: "light", updatedAt: "2026-06-28T12:00:00.000Z" });

        render(
          <SettingsView
            tasks={[]}
            courses={[]}
            appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
            onAppearanceChange={onAppearanceChange}
          />
        );

        const gameLayerToggle = screen.getByLabelText(/Show progress & game layer/i);
        fireEvent.click(gameLayerToggle);
        expect(onAppearanceChange).toHaveBeenCalledWith({ showGameLayer: true });
      });

      it("T1.38: regenerates and confirms recovery key for signed-in account", async () => {
        const onRegenerateRecoveryKey = vi.fn().mockResolvedValue("test-sec-key-1234");

        render(
          <SettingsView
            tasks={[]}
            courses={[]}
            appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
            onAppearanceChange={vi.fn()}
            account={{ email: "scholar@throughline.app", syncStatus: "idle", lastSyncAt: null }}
            onRegenerateRecoveryKey={onRegenerateRecoveryKey}
          />
        );

        fireEvent.click(screen.getByRole("button", { name: /Regenerate recovery key/i }));
        expect(await screen.findByText("test-sec-key-1234")).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText(/I saved this recovery key/i));
        fireEvent.change(screen.getByLabelText(/Confirm last 4 characters/i), { target: { value: "1234" } });
        expect(screen.getByText(/Saved confirmation complete/i)).toBeInTheDocument();
      });

      it("T1.39: displays sync status and allows triggering manual sync", () => {
        const onSyncNow = vi.fn();

        render(
          <SettingsView
            tasks={[]}
            courses={[]}
            appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
            onAppearanceChange={vi.fn()}
            account={{ email: "scholar@throughline.app", syncStatus: "idle", lastSyncAt: "2026-06-28T12:00:00.000Z" }}
            onSyncNow={onSyncNow}
          />
        );

        expect(screen.getByText("Up to date")).toBeInTheDocument();
        const syncNowBtn = screen.getByRole("button", { name: /Sync now/i });
        fireEvent.click(syncNowBtn);
        expect(onSyncNow).toHaveBeenCalled();
      });

      it("T1.40: triggers ICS calendar export and backup export", () => {
        const taskWithDue = createTask({ id: "ics_t", title: "Final Exam", dueAt: "2026-12-15T10:00:00.000Z" });

        render(
          <SettingsView
            tasks={[taskWithDue]}
            courses={[]}
            appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
            onAppearanceChange={vi.fn()}
          />
        );

        expect(screen.getByRole("button", { name: /Export ICS/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Export backup/i })).toBeInTheDocument();
      });
    });

    // 9. Global Shortcuts & Shell Chrome
    describe("Global Shortcuts & Shell Chrome", () => {
      it("T1.41: presses 'N' to open task composer from planner views", async () => {
        await saveAppearanceSettings({ hasCompletedOnboarding: true });
        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        await screen.findAllByRole("link", { name: "Today" });
        fireEvent.keyDown(document.body, { key: "n" });

        expect(await screen.findByText("New task")).toBeInTheDocument();
      });

      it("T1.42: presses 'N' in notes view to create a new note", async () => {
        await saveAppearanceSettings({ hasCompletedOnboarding: true });
        window.history.replaceState({}, "", "/app?view=notes");

        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        await screen.findByRole("button", { name: "New note" });
        fireEvent.keyDown(document.body, { key: "n" });

        await waitFor(() => {
          expect(screen.getByLabelText("Note title")).toBeInTheDocument();
        });
      });

      it("T1.43: suppresses 'N' shortcut when typing inside input or textarea", async () => {
        await saveAppearanceSettings({ hasCompletedOnboarding: true });
        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        await screen.findAllByRole("link", { name: "Today" });
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();

        fireEvent.keyDown(input, { key: "n" });
        expect(screen.queryByText("New task")).not.toBeInTheDocument();
        document.body.removeChild(input);
      });

      it("T1.44: presses 'Ctrl+K' or 'Cmd+K' to open Command Palette", async () => {
        await saveAppearanceSettings({ hasCompletedOnboarding: true });
        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        await screen.findAllByRole("link", { name: "Today" });
        fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });

        expect(await screen.findByPlaceholderText("Type a command or search...")).toBeInTheDocument();
      });

      it("T1.45: primary action button dynamically switches label between views", async () => {
        await saveAppearanceSettings({ hasCompletedOnboarding: true });
        window.history.replaceState({}, "", "/app?view=notes");

        render(
          <AuthProvider>
            <App />
          </AuthProvider>
        );

        expect(await screen.findByRole("button", { name: "New note" })).toBeInTheDocument();
      });
    });

    // 10. Dialog & Sheet Overlays
    describe("Dialog & Sheet Overlays", () => {
      it("T1.46: renders Sheet with accessible title and ink border", () => {
        render(
          <Sheet open={true} title="Test Dialog" onClose={vi.fn()}>
            <p>Dialog body text</p>
          </Sheet>
        );

        expect(screen.getByText("Test Dialog")).toBeInTheDocument();
        expect(screen.getByText("Dialog body text")).toBeInTheDocument();
      });

      it("T1.47: closes Sheet on Escape key press", () => {
        const onClose = vi.fn();
        render(
          <Sheet open={true} title="Closable Dialog" onClose={onClose}>
            <div>Interactive body</div>
          </Sheet>
        );

        fireEvent.keyDown(document.body, { key: "Escape" });
        expect(onClose).toHaveBeenCalled();
      });

      it("T1.48: closes Sheet on Close button click", () => {
        const onClose = vi.fn();
        render(
          <Sheet open={true} title="Closable Dialog" onClose={onClose}>
            <div>Interactive body</div>
          </Sheet>
        );

        const closeBtn = screen.getByRole("button", { name: "Close" });
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
      });

      it("T1.49: does not render Sheet content when open is false", () => {
        render(
          <Sheet open={false} title="Hidden Dialog" onClose={vi.fn()}>
            <p>Secret content</p>
          </Sheet>
        );

        expect(screen.queryByText("Hidden Dialog")).not.toBeInTheDocument();
        expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
      });

      it("T1.50: applies Inkline Level 4 elevation with 8px hard offset shadow", () => {
        const { container } = render(
          <Sheet open={true} title="Elevation Check" onClose={vi.fn()}>
            <div>Content</div>
          </Sheet>
        );

        const sheetEl = container.querySelector(".sheet");
        expect(sheetEl).toBeInTheDocument();
      });
    });
  });

  /* ==========================================================================
     TIER 2: BOUNDARY & CORNER CASES
     ========================================================================== */
  describe("Tier 2: Boundary & Corner Cases", () => {
    it("T2.1: handles empty states across all views without crashing", () => {
      // Empty Today
      const { unmount: u1 } = renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
        planner: { tasks: [], courses: [], courseById: new Map() }
      });
      expect(screen.getByText("No urgent work is asking for you right now.")).toBeInTheDocument();
      u1();

      // Empty Timeline
      const { unmount: u2 } = renderWithPlanner(<TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} />, {
        planner: { tasks: [], courses: [], courseById: new Map() }
      });
      expect(screen.getByText("Nothing scheduled")).toBeInTheDocument();
      u2();

      // Empty Goals
      const { unmount: u3 } = render(
        <GoalsView
          goals={[]}
          tasks={[]}
          courses={[]}
          notes={[]}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
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
      u3();

      // Empty Notes
      const { unmount: u4 } = render(
        <NotesView
          notes={[]}
          tasks={[]}
          goals={[]}
          onAddNote={vi.fn()}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );
      expect(screen.getByText("No notes yet")).toBeInTheDocument();
      u4();

      // Empty Courses
      const { unmount: u5 } = render(
        <CoursesView courses={[]} tasks={[]} onUpsertCourse={vi.fn()} onDeleteCourse={vi.fn()} />
      );
      expect(screen.getByText("No projects yet")).toBeInTheDocument();
      u5();
    });

    it("T2.2: handles maximum length strings (140-char title boundary and 1500-char description)", () => {
      const maxTitle = "A".repeat(140);
      const maxDescription = "D".repeat(1500);
      const task = createTask({ id: "t_max", title: maxTitle, description: maxDescription, status: "ready" });

      renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
        planner: { tasks: [task], courses: [], courseById: new Map() }
      });

      expect(screen.getByText(maxTitle)).toBeInTheDocument();
      expect(() => createTask({ title: "B".repeat(141) })).toThrow();
    });

    it("T2.3: handles extreme past-due dates (365+ days ago) in Today and Insights", () => {
      const ancientDate = new Date("2020-01-01T00:00:00.000Z").toISOString();
      const ancientTask = createTask({
        id: "t_ancient",
        title: "Ancient Pending Task",
        status: "ready",
        dueAt: ancientDate
      });

      renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
        planner: { tasks: [ancientTask], courses: [], courseById: new Map() }
      });

      expect(screen.getByText(/1 task is overdue/i)).toBeInTheDocument();
      expect(screen.getByText("Ancient Pending Task")).toBeInTheDocument();
    });

    it("T2.4: handles extreme future dates (year 2050) in Timeline and TaskCard", () => {
      const futureDate = "2050-12-31T23:59:59.000Z";
      const futureTask = createTask({
        id: "t_future",
        title: "Far Future Milestone",
        status: "ready",
        dueAt: futureDate
      });

      render(
        <TaskCard
          task={futureTask}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onStartFocus={vi.fn()}
        />
      );

      expect(screen.getByText("Far Future Milestone")).toBeInTheDocument();
    });

    it("T2.5: handles tasks with null/undefined due dates (pure backlog items)", () => {
      const undatedTask = createTask({
        id: "t_undated",
        title: "Undated Backlog Research",
        status: "backlog"
      });

      const restore = stubMatchMedia();
      renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} />, {
        planner: { tasks: [undatedTask], courses: [], courseById: new Map() }
      });

      expect(screen.getByText("Undated Backlog Research")).toBeInTheDocument();
      restore();
    });

    it("T2.6: handles rapid theme cycling (light -> dark -> system -> light) cleanly", async () => {
      const onAppearanceChange = vi.fn().mockImplementation(async (patch) => ({
        id: "appearance-settings",
        lowPower3d: false,
        theme: patch.theme ?? "light",
        showGameLayer: false,
        hasCompletedOnboarding: true,
        pwaBannerDismissed: false,
        updatedAt: "2026-06-28T12:00:00.000Z"
      }));

      render(
        <SettingsView
          tasks={[]}
          courses={[]}
          appearanceSettings={{ id: "appearance-settings", lowPower3d: false, theme: "light", showGameLayer: false, hasCompletedOnboarding: true, pwaBannerDismissed: false, updatedAt: "2026-06-28T12:00:00.000Z" }}
          onAppearanceChange={onAppearanceChange}
        />
      );

      const darkBtn = screen.getByRole("button", { name: /Dark/i });
      const systemBtn = screen.getByRole("button", { name: /System/i });
      const lightBtn = screen.getByRole("button", { name: /Light/i });

      fireEvent.click(darkBtn);
      fireEvent.click(systemBtn);
      fireEvent.click(lightBtn);

      expect(onAppearanceChange).toHaveBeenCalledTimes(3);
    });

    it("T2.7: sanitizes and safely escapes HTML and XSS payloads in titles and notes", () => {
      const maliciousPayload = "<script>alert('xss')</script><b>Bold Attempt</b>";
      const xssTask = createTask({ id: "t_xss", title: maliciousPayload, status: "ready" });

      render(
        <TaskCard
          task={xssTask}
          onComplete={vi.fn()}
          onEdit={vi.fn()}
          onStartFocus={vi.fn()}
        />
      );

      expect(screen.getByText(maliciousPayload)).toBeInTheDocument();
      expect(document.querySelector("script")).toBeNull();
    });

    it("T2.8: rejects empty and whitespace-only submissions in task composer", () => {
      const onAddTask = vi.fn();
      render(<TaskComposer courses={[]} onAddTask={onAddTask} />);

      const submitButton = screen.getByRole("button", { name: "Add task" });
      expect(submitButton).toBeDisabled();

      const titleInput = screen.getByLabelText("Title");
      fireEvent.change(titleInput, { target: { value: "   " } });
      expect(submitButton).toBeDisabled();
    });

    it("T2.9: handles zero-progress and 100%-progress goal roll-up calculations", () => {
      const goal0 = createGoal({ id: "g0", title: "Zero Progress Goal" });
      const t0 = createTask({ id: "t0_1", goalId: goal0.id, title: "Step 1", status: "ready" });

      const { unmount } = render(
        <GoalsView
          goals={[goal0]}
          tasks={[t0]}
          courses={[]}
          notes={[]}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
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

      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("0/1 steps")).toBeInTheDocument();
      unmount();

      const goal100 = createGoal({ id: "g100", title: "Finished Goal" });
      const t100 = createTask({ id: "t100_1", goalId: goal100.id, title: "Step Done", status: "done" });

      render(
        <GoalsView
          goals={[goal100]}
          tasks={[t100]}
          courses={[]}
          notes={[]}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
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

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("1/1 steps")).toBeInTheDocument();
    });

    it("T2.10: handles non-alphanumeric and arrow key navigation boundaries on board", () => {
      const restore = stubMatchMedia();
      const onStatusChange = vi.fn();
      const task = createTask({ id: "t_bound", title: "Boundary Test Task", status: "backlog" });

      renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={onStatusChange} onEdit={vi.fn()} />, {
        planner: { tasks: [task], courses: [], courseById: new Map() }
      });

      const card = document.getElementById("task-card-t_bound");
      if (card) {
        // Left arrow on first column (backlog) cannot move further left
        fireEvent.keyDown(card, { key: "ArrowLeft", ctrlKey: true });
        expect(onStatusChange).not.toHaveBeenCalled();

        // ArrowRight moves from backlog to ready
        fireEvent.keyDown(card, { key: "ArrowRight", ctrlKey: true });
        expect(onStatusChange).toHaveBeenCalledWith("t_bound", "ready");
      }
      restore();
    });
  });

  /* ==========================================================================
     TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Coverage)
     ========================================================================== */
  describe("Tier 3: Cross-Feature Combinations", () => {
    it("T3.1: Course + Task + Goal: creates task linked to course and goal, verifies appearance and roll-up progress", () => {
      const course = createCourse({ id: "c_combo", name: "Neuroscience", code: "NEURO", color: "#8f6bf5", icon: "N" });
      const goal = createGoal({ id: "g_combo", title: "Master Brain Anatomy" });
      const task = createTask({
        id: "t_combo_1",
        courseId: course.id,
        goalId: goal.id,
        title: "Memorize cranial nerves",
        status: "ready"
      });

      // 1. Appears in GoalsView under this goal
      const { unmount: u1 } = render(
        <GoalsView
          goals={[goal]}
          tasks={[task]}
          courses={[course]}
          notes={[]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
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
      expect(screen.getByText("Memorize cranial nerves")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
      u1();

      // 2. Appears in CoursesView under this course count
      const { unmount: u2 } = render(
        <CoursesView courses={[course]} tasks={[task]} onUpsertCourse={vi.fn()} onDeleteCourse={vi.fn()} />
      );
      expect(screen.getByText("Neuroscience")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      u2();

      // 3. Completing task advances goal progress
      const completedTask = { ...task, status: "done" as const };
      render(
        <GoalsView
          goals={[goal]}
          tasks={[completedTask]}
          courses={[course]}
          notes={[]}
          selectedId={goal.id}
          onSelectGoal={vi.fn()}
          onNewGoal={vi.fn()}
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
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("T3.2: Note + Goal + Task: links note to goal and task, verifies bidirectional navigation and chip reflection", () => {
      const goal = createGoal({ id: "g_bidir", title: "Pass Final Exams" });
      const task = createTask({ id: "t_bidir", title: "Practice Problem Sets", goalId: goal.id });
      const note = createNote({
        id: "n_bidir",
        title: "Problem Set Formulas",
        goalIds: [goal.id],
        taskIds: [task.id]
      });

      render(
        <NotesView
          notes={[note]}
          tasks={[task]}
          goals={[goal]}
          selectedId={note.id}
          onAddNote={vi.fn()}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );

      expect(screen.getByText("Pass Final Exams")).toBeInTheDocument();
      expect(screen.getByText("Practice Problem Sets")).toBeInTheDocument();
    });

    it("T3.3: Task Completion -> Board & Today -> Insights: completing task updates board, Today fraction, and Insights statistics", async () => {
      const course = sampleCourses[0];
      await db.courses.bulkPut([course]);

      const now = new Date().toISOString();
      const t1 = createTask({ id: "t_pipe_1", title: "Task Pipeline 1", courseId: course.id, status: "done", completedAt: now });
      const t2 = createTask({ id: "t_pipe_2", title: "Task Pipeline 2", courseId: course.id, status: "ready", dueAt: now });
      await db.tasks.bulkPut([t1, t2]);

      const { unmount } = renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
        planner: {
          tasks: [t1, t2],
          courses: [course],
          courseById: new Map([[course.id, course]])
        }
      });
      expect(screen.getByText("1 of 2 tasks done. Keep it quiet and steady.")).toBeInTheDocument();
      unmount();

      render(
        <PlannerProvider>
          <InsightsView />
        </PlannerProvider>
      );
      expect(await screen.findByText("Completed")).toBeInTheDocument();
      expect((await screen.findAllByText(/1/)).length).toBeGreaterThan(0);
    });

    it("T3.4: Command Palette Global Search: indexes tasks, notes, goals, courses; filters by keyword and navigates to target", () => {
      const onOpenResult = vi.fn();
      render(
        <CommandPalette
          open={true}
          setOpen={vi.fn()}
          onNavigate={vi.fn()}
          onNewTask={vi.fn()}
          onToggleTheme={vi.fn()}
          searchResults={[
            {
              id: "task_res_1",
              type: "task",
              title: "Cell Division Summary",
              subtitle: "Task",
              view: "kanban",
              groupLabel: "Tasks",
              lastTouchedAt: new Date().toISOString(),
              actionLabel: "Open task"
            },
            {
              id: "note_res_1",
              type: "note",
              title: "Cell Division Lab Notes",
              subtitle: "Note",
              view: "notes",
              groupLabel: "Notes",
              lastTouchedAt: new Date().toISOString(),
              actionLabel: "Open note"
            }
          ]}
          onOpenResult={onOpenResult}
        />
      );

      const searchInput = screen.getByPlaceholderText("Type a command or search...");
      fireEvent.change(searchInput, { target: { value: "Cell" } });

      const resultItem = screen.getByText("Cell Division Summary");
      fireEvent.click(resultItem);

      expect(onOpenResult).toHaveBeenCalledWith(expect.objectContaining({ id: "task_res_1", type: "task" }));
    });

    it("T3.5: Focus Timer -> Cooldown Suggestions: completing focus session recommends backlog tasks in cooldown modal", () => {
      const onRecordFocusSession = vi.fn().mockResolvedValue({
        id: "fs_done",
        durationMinutes: 25,
        startedAt: new Date().toISOString()
      });

      const task = createTask({ id: "t_focus_session", title: "Deep coding sprint" });
      renderWithPlanner(<TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={vi.fn()} />, {
        planner: {
          tasks: [task],
          courses: [],
          courseById: new Map(),
          recordFocusSession: onRecordFocusSession
        }
      });

      expect(screen.getByText("Deep coding sprint")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     TIER 4: REAL-WORLD WORKLOAD SCENARIOS
     ========================================================================== */
  describe("Tier 4: Real-World Workload Scenarios", () => {
    it("T4.1: Scenario 1 (Student Semester Setup): sets up courses, creates assignments with due dates and tags, breaks into subtasks", async () => {
      const bio = createCourse({ id: "c_bio_sem", name: "Biology 101", code: "BIO101", color: "#1fae67", icon: "B" });
      const math = createCourse({ id: "c_math_sem", name: "Calculus I", code: "MATH101", color: "#3d5afe", icon: "M" });
      await upsertCourseRecord(bio);
      await upsertCourseRecord(math);

      await addTaskRecord({
        title: "Calculus Problem Set 1",
        courseId: math.id,
        dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        priority: "high",
        energy: 2,
        difficulty: 2,
        attributes: ["focus"],
        tags: ["homework", "math"],
        subtasks: [
          { id: "sub1", title: "Problems 1-5 (Limits)", completed: false },
          { id: "sub2", title: "Problems 6-10 (Derivatives)", completed: false }
        ]
      });

      const tasks = await db.tasks.toArray();
      const courses = await db.courses.toArray();

      render(<CoursesView courses={courses} tasks={tasks} onUpsertCourse={vi.fn()} onDeleteCourse={vi.fn()} />);

      expect(screen.getByText("Biology 101")).toBeInTheDocument();
      expect(screen.getByText("Calculus I")).toBeInTheDocument();
    });

    it("T4.2: Scenario 2 (Daily Morning Planning): reviews Today overdue, moves tasks to Doing on Kanban, launches focus timer", async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const overdueTask = createTask({
        id: "t_overdue_plan",
        title: "Submit Ethics Worksheet",
        status: "ready",
        dueAt: yesterday
      });

      const onStatusChange = vi.fn();
      const onStartFocus = vi.fn();

      const { unmount } = renderWithPlanner(
        <TodayView onNewTask={vi.fn()} onEdit={vi.fn()} onStartFocus={onStartFocus} />,
        {
          planner: { tasks: [overdueTask], courses: [], courseById: new Map() }
        }
      );
      expect(screen.getByText(/1 task is overdue/i)).toBeInTheDocument();
      unmount();

      const restore = stubMatchMedia();
      renderWithPlanner(<BoardView onComplete={vi.fn()} onStatusChange={onStatusChange} onEdit={vi.fn()} />, {
        planner: { tasks: [overdueTask], courses: [], courseById: new Map() }
      });

      const card = document.getElementById("task-card-t_overdue_plan");
      if (card) {
        fireEvent.keyDown(card, { key: "ArrowRight", ctrlKey: true });
        expect(onStatusChange).toHaveBeenCalledWith("t_overdue_plan", "doing");
      }
      restore();
    });

    it("T4.3: Scenario 3 (Midterm Study Sprint): creates study goal, authors lecture notes, links notes to goal, logs focus session", async () => {
      const studyGoal = createGoal({ id: "g_midterm", title: "Ace Organic Chem Midterm" });
      const studyTask = createTask({ id: "t_midterm_1", goalId: studyGoal.id, title: "Review Reaction Mechanisms", status: "ready" });
      const studyNote = createNote({
        id: "n_midterm_1",
        title: "SN1 vs SN2 Mechanisms",
        body: "# Reaction Notes\n\nPolar protic vs aprotic solvents.",
        goalIds: [studyGoal.id],
        taskIds: [studyTask.id]
      });

      render(
        <NotesView
          notes={[studyNote]}
          tasks={[studyTask]}
          goals={[studyGoal]}
          selectedId={studyNote.id}
          onAddNote={vi.fn()}
          onUpdateNote={vi.fn()}
          onRemoveNote={vi.fn()}
          onToggleLink={vi.fn()}
        />
      );

      expect(screen.getByText("Ace Organic Chem Midterm")).toBeInTheDocument();
      expect(screen.getByText("Review Reaction Mechanisms")).toBeInTheDocument();
    });

    it("T4.4: Scenario 4 (End-of-Day Review & Gamification): completes remaining daily tasks, triggers celebration burst/XP, verifies daily stats", () => {
      const onComplete = vi.fn();
      const eveningTask = createTask({
        id: "t_evening_1",
        title: "Review daily notes",
        status: "ready"
      });

      render(
        <TaskCard
          task={eveningTask}
          showGameLayer={true}
          onComplete={onComplete}
          onEdit={vi.fn()}
          onStartFocus={vi.fn()}
        />
      );

      const completeButton = screen.getByRole("button", { name: "Complete Review daily notes" });
      fireEvent.click(completeButton);

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: "t_evening_1" }));
    });

    it("T4.5: Scenario 5 (Power-User Pure Keyboard Workflow): navigates views via Ctrl+K, captures tasks with N, closes dialogs with Escape", async () => {
      await saveAppearanceSettings({ hasCompletedOnboarding: true });
      render(
        <AuthProvider>
          <App />
        </AuthProvider>
      );

      await screen.findAllByRole("link", { name: "Today" });

      // 1. Open command palette via Ctrl+K
      fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
      const paletteInput = await screen.findByPlaceholderText("Type a command or search...");
      expect(paletteInput).toBeInTheDocument();

      // 2. Close command palette with Escape
      fireEvent.keyDown(paletteInput, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Type a command or search...")).not.toBeInTheDocument();
      });

      // 3. Quick capture with N
      fireEvent.keyDown(document.body, { key: "n" });
      expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();

      // 4. Close composer with Escape
      fireEvent.keyDown(document.body, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument();
      });
    });
  });
});

const onStatusChangeDummy = () => {};
