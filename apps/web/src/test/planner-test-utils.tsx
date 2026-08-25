import { Course, FocusSession, Goal, Note, Task, createCourse, createGoal, createNote, createTask } from "@throughline/domain";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { TaskStatus } from "@throughline/domain";
import { PlannerContext } from "../state/PlannerProvider";
import type { FocusSessionInput, GoalInput, NoteInput, TaskInput } from "../data/repositories";

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return createCourse({ name: "Biology", color: "#1fae67", icon: "B", ...overrides });
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  const timestamp = new Date().toISOString();
  return createTask({
    title: "Test task",
    ...overrides,
    createdAt: overrides.createdAt ?? timestamp
  });
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return createGoal({ title: "Test goal", ...overrides });
}

export function makeNote(overrides: Partial<Note> = {}): Note {
  return createNote({ title: "Test note", ...overrides });
}

export type PlannerStub = {
  tasks: Task[];
  courses: Course[];
  goals: Goal[];
  notes: Note[];
  focusSessions: FocusSession[];
  loading: boolean;
  courseById: Map<string, Course>;
  noteCountByTask: Map<string, number>;
  tags: string[];
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  completeTask: (task: Task) => void;
  upsertCourse: (course: Course) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addGoal: (input: GoalInput) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  setGoalStatus: (goalId: string, status: "active" | "paused" | "done") => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  addNote: (input?: NoteInput) => Promise<Note>;
  updateNote: (note: Note) => Promise<Note>;
  removeNote: (noteId: string) => Promise<void>;
  toggleNoteLink: (noteId: string, kind: "task" | "goal", refId: string, linked: boolean) => Promise<void>;
  recordFocusSession: (input?: FocusSessionInput) => Promise<FocusSession>;
};

const noop = () => {};
const asyncNoop = () => Promise.resolve();
const resolvedNote = () => Promise.resolve(makeNote());

export const DEFAULT_PLANNER: PlannerStub = {
  tasks: [],
  courses: [],
  goals: [],
  notes: [],
  focusSessions: [],
  loading: false,
  courseById: new Map<string, Course>(),
  noteCountByTask: new Map<string, number>(),
  tags: [],
  addTask: asyncNoop,
  updateTask: asyncNoop,
  deleteTask: asyncNoop,
  updateTaskStatus: asyncNoop,
  completeTask: noop,
  upsertCourse: asyncNoop,
  deleteCourse: asyncNoop,
  addGoal: asyncNoop,
  updateGoal: asyncNoop,
  setGoalStatus: asyncNoop,
  removeGoal: asyncNoop,
  addNote: resolvedNote,
  updateNote: (note) => Promise.resolve(note),
  removeNote: asyncNoop,
  toggleNoteLink: asyncNoop,
  recordFocusSession: () =>
    Promise.resolve({
      id: "session_stub",
      title: "Focus Session",
      startedAt: new Date().toISOString(),
      durationMinutes: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
};

/**
 * Renders a component wrapped in a stubbed planner context so views that read
 * planner data via `usePlanner()` can be tested without IndexedDB.
 */
export function renderWithPlanner(
  ui: ReactElement,
  options: {
    planner?: Partial<PlannerStub>;
    wrap?: (node: ReactElement) => ReactNode;
  } = {}
) {
  const value: PlannerStub = { ...DEFAULT_PLANNER, ...options.planner };
  const Wrapper = options.wrap ?? ((node: ReactElement) => node);
  return render(<PlannerContext.Provider value={value}>{Wrapper(ui)}</PlannerContext.Provider>);
}

export { noop, asyncNoop };
