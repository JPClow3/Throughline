import {
  Course,
  CourseSchema,
  Goal,
  GoalSchema,
  GoalStatus,
  Note,
  NoteSchema,
  Priority,
  RpgAttribute,
  Subtask,
  Task,
  TaskSchema,
  TaskStatus,
  RecurrencePattern
} from "./types";
import { calculateTaskXp } from "./gamification";

type TaskDraft = {
  title: string;
  description?: string;
  status?: TaskStatus;
  courseId?: string;
  goalId?: string;
  order?: number;
  dueAt?: string;
  reminderAt?: string;
  priority?: Priority;
  energy?: number;
  difficulty?: number;
  estimatedMinutes?: number;
  attributes?: RpgAttribute[];
  tags?: string[];
  subtasks?: Subtask[];
  recurrence?: RecurrencePattern;
};

type GoalDraft = {
  title: string;
  summary?: string;
  status?: GoalStatus;
  targetDate?: string;
  projectId?: string;
  color?: string;
  icon?: string;
  priority?: Priority;
};

type NoteDraft = {
  title?: string;
  body?: string;
  taskIds?: string[];
  goalIds?: string[];
  projectId?: string;
  pinned?: boolean;
};

export function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

type CourseDraft = {
  name: string;
  code?: string;
  color: string;
  icon: string;
  professor?: string;
  semester?: string;
};

export function createCourse(input: CourseDraft & { id?: string; createdAt?: string }): Course {
  const now = new Date().toISOString();
  return CourseSchema.parse({
    id: input.id ?? createId("course"),
    ...input,
    createdAt: input.createdAt ?? now,
    updatedAt: now
  });
}

export function createTask(input: TaskDraft & { id?: string; createdAt?: string }): Task {
  const now = new Date().toISOString();
  const task = TaskSchema.parse({
    id: input.id ?? createId("task"),
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "backlog",
    courseId: input.courseId,
    goalId: input.goalId,
    order: input.order ?? 0,
    dueAt: input.dueAt,
    reminderAt: input.reminderAt,
    priority: input.priority ?? "medium",
    energy: input.energy ?? 2,
    difficulty: input.difficulty ?? 2,
    estimatedMinutes: input.estimatedMinutes ?? 45,
    xp: 0,
    attributes: input.attributes ?? ["focus"],
    tags: input.tags ?? [],
    subtasks: input.subtasks ?? [],
    recurrence: input.recurrence,
    visualSeed: Math.floor(Math.random() * 9999),
    createdAt: input.createdAt ?? now,
    updatedAt: now
  });

  return {
    ...task,
    xp: calculateTaskXp(task)
  };
}

export function createGoal(input: GoalDraft & { id?: string; createdAt?: string }): Goal {
  const now = new Date().toISOString();

  return GoalSchema.parse({
    id: input.id ?? createId("goal"),
    title: input.title,
    summary: input.summary ?? "",
    status: input.status ?? "active",
    targetDate: input.targetDate,
    projectId: input.projectId,
    color: input.color,
    icon: input.icon,
    priority: input.priority ?? "medium",
    createdAt: input.createdAt ?? now,
    updatedAt: now
  });
}

export function createNote(input: NoteDraft & { id?: string; createdAt?: string }): Note {
  const now = new Date().toISOString();

  return NoteSchema.parse({
    id: input.id ?? createId("note"),
    title: input.title ?? "",
    body: input.body ?? "",
    taskIds: input.taskIds ?? [],
    goalIds: input.goalIds ?? [],
    projectId: input.projectId,
    pinned: input.pinned ?? false,
    createdAt: input.createdAt ?? now,
    updatedAt: now
  });
}
