import { Course, FocusSession, Goal, Note, Task, TaskStatus } from "@throughline/domain";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FocusSessionInput, GoalInput, NoteInput, TaskInput } from "../data/repositories";
import { useFocusSessions } from "../hooks/useFocusSessions";
import { useGoals } from "../hooks/useGoals";
import { useNotes } from "../hooks/useNotes";
import { countNotesByTask } from "../lib/noteCounts";
import { useTasks } from "../hooks/useTasks";

type PlannerContextValue = {
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

const EMPTY_TAGS: string[] = [];

const PlannerContext = createContext<PlannerContextValue | null>(null);

export { PlannerContext };

/**
 * Single provider over the local-first Dexie stores. Views read planner data
 * from context instead of receiving every record and mutation through props.
 */
export function PlannerProvider({ children }: { children: ReactNode }) {
  const {
    tasks,
    courses,
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse
  } = useTasks();
  const { goals, addGoal, updateGoal, setGoalStatus, removeGoal } = useGoals();
  const { notes, addNote, updateNote, removeNote, toggleNoteLink } = useNotes();
  const { focusSessions, loading: focusLoading, recordFocusSession } = useFocusSessions();

  const value = useMemo<PlannerContextValue>(() => {
    const courseById = new Map(courses.map((course) => [course.id, course]));
    const noteCountByTask = countNotesByTask(notes);
    const tags = Array.from(new Set(tasks.flatMap((task) => task.tags ?? []))).sort((a, b) => a.localeCompare(b));
    return {
      tasks,
      courses,
      goals,
      notes,
      focusSessions,
      loading: tasksLoading || focusLoading,
      courseById,
      noteCountByTask,
      tags,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      completeTask,
      upsertCourse,
      deleteCourse,
      addGoal,
      updateGoal,
      setGoalStatus,
      removeGoal,
      addNote,
      updateNote,
      removeNote,
      toggleNoteLink,
      recordFocusSession
    };
  }, [
    tasks,
    courses,
    goals,
    notes,
    focusSessions,
    tasksLoading,
    focusLoading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    upsertCourse,
    deleteCourse,
    addGoal,
    updateGoal,
    setGoalStatus,
    removeGoal,
    addNote,
    updateNote,
    removeNote,
    toggleNoteLink,
    recordFocusSession
  ]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const value = useContext(PlannerContext);
  if (!value) {
    throw new Error("usePlanner must be used inside <PlannerProvider>");
  }
  return value;
}

export { EMPTY_TAGS };
