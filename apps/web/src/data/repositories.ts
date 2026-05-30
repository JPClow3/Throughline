import {
  Course,
  Goal,
  GoalStatus,
  Note,
  Priority,
  RpgAttribute,
  Subtask,
  Task,
  TaskStatus,
  CourseSchema,
  GoalSchema,
  NoteSchema,
  TaskSchema,
  calculateTaskXp,
  createGoal,
  createNote,
  createTask,
  deriveUserProgress,
  nextGoalTaskOrder
} from "@throughline/domain";
import { z } from "zod";
import { db, refreshProgress } from "./db";
import { AppearanceSettings, ReminderSyncState, appearanceSettingsId, reminderSyncStateId } from "./types";

export type TaskInput = {
  title: string;
  description?: string;
  courseId?: string;
  goalId?: string;
  order?: number;
  dueAt?: string;
  reminderAt?: string;
  priority: Priority;
  energy: number;
  difficulty: number;
  attributes: RpgAttribute[];
  tags?: string[];
  subtasks?: Subtask[];
};

export type GoalInput = {
  title: string;
  summary?: string;
  targetDate?: string;
  projectId?: string;
  color?: string;
  icon?: string;
  priority?: Priority;
};

export function defaultPushApiUrl() {
  return import.meta.env.VITE_PUSH_API_URL ?? "http://127.0.0.1:8787";
}

function now() {
  return new Date().toISOString();
}

export async function listTasks() {
  return db.tasks.orderBy("updatedAt").reverse().toArray();
}

export async function listCourses() {
  return db.courses.toArray();
}

export async function addTask(input: TaskInput) {
  const dueAt = input.dueAt ? new Date(input.dueAt).toISOString() : undefined;
  const reminderAt = input.reminderAt ? new Date(input.reminderAt).toISOString() : dueAt;
  // When a task is filed under a goal without an explicit order, append it.
  const order =
    input.goalId && input.order == null ? nextGoalTaskOrder(input.goalId, await db.tasks.toArray()) : input.order;
  const task = createTask({
    ...input,
    order,
    dueAt,
    reminderAt,
    description: input.description?.trim() ?? "",
    tags: input.tags ?? [],
    subtasks: input.subtasks ?? [],
    status: "backlog",
    estimatedMinutes: input.energy * 25
  });

  await db.tasks.put(task);
  await refreshProgress();
  return task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const completedAt = status === "done" ? now() : undefined;
  await db.tasks.update(taskId, {
    status,
    updatedAt: now(),
    completedAt
  });
  await refreshProgress();
}

export async function updateTask(task: Task) {
  const updated = {
    ...task,
    xp: calculateTaskXp(task),
    updatedAt: now()
  };

  await db.tasks.put(updated);
  await refreshProgress();
  return updated;
}

export async function deleteTask(taskId: string) {
  await db.tasks.delete(taskId);
  await refreshProgress();
}

export async function upsertCourse(course: Course) {
  await db.courses.put(course);
}

export async function deleteCourse(courseId: string) {
  // Detach the project from its tasks rather than deleting the tasks themselves.
  await db.transaction("rw", db.courses, db.tasks, async () => {
    const linkedTasks = await db.tasks.where("courseId").equals(courseId).toArray();
    await Promise.all(
      linkedTasks.map((task) => db.tasks.update(task.id, { courseId: undefined, updatedAt: now() }))
    );
    await db.courses.delete(courseId);
  });
}

export async function listGoals() {
  return db.goals.orderBy("updatedAt").reverse().toArray();
}

export async function addGoal(input: GoalInput) {
  const goal = createGoal({
    ...input,
    targetDate: input.targetDate ? new Date(input.targetDate).toISOString() : undefined
  });

  await db.goals.put(goal);
  return goal;
}

export async function updateGoal(goal: Goal) {
  const next = { ...goal, updatedAt: now() };
  await db.goals.put(next);
  return next;
}

export async function setGoalStatus(goalId: string, status: GoalStatus) {
  await db.goals.update(goalId, {
    status,
    completedAt: status === "done" ? now() : undefined,
    updatedAt: now()
  });
}

export async function deleteGoal(goalId: string) {
  // Keep the child tasks but detach them so they are not orphaned to a missing goal.
  await db.transaction("rw", db.goals, db.tasks, async () => {
    const childTasks = await db.tasks.where("goalId").equals(goalId).toArray();
    await Promise.all(
      childTasks.map((task) => db.tasks.update(task.id, { goalId: undefined, updatedAt: now() }))
    );
    await db.goals.delete(goalId);
  });
}

export type NoteInput = {
  title?: string;
  body?: string;
  taskIds?: string[];
  goalIds?: string[];
  projectId?: string;
  pinned?: boolean;
};

export async function listNotes() {
  return db.notes.orderBy("updatedAt").reverse().toArray();
}

export async function addNote(input: NoteInput = {}) {
  const note = createNote(input);
  await db.notes.put(note);
  return note;
}

export async function updateNote(note: Note) {
  const next = { ...note, updatedAt: now() };
  await db.notes.put(next);
  return next;
}

export async function deleteNote(noteId: string) {
  await db.notes.delete(noteId);
}

/** Add or remove a link between a note and a task/goal. */
export async function toggleNoteLink(noteId: string, kind: "task" | "goal", refId: string, linked: boolean) {
  const note = await db.notes.get(noteId);
  if (!note) {
    return;
  }

  const current = new Set(kind === "task" ? note.taskIds : note.goalIds);
  if (linked) {
    current.add(refId);
  } else {
    current.delete(refId);
  }

  const patch = kind === "task" ? { taskIds: [...current] } : { goalIds: [...current] };
  await db.notes.update(noteId, { ...patch, updatedAt: now() });
}

export async function getProgress() {
  const stored = await db.progress.get("local-player");
  if (stored) {
    return stored;
  }

  return deriveUserProgress(await db.tasks.toArray());
}

export async function getReminderSyncState(): Promise<ReminderSyncState> {
  const stored = await db.settings.get(reminderSyncStateId);
  if (stored?.id === reminderSyncStateId) {
    return stored;
  }

  return {
    id: reminderSyncStateId,
    pushApiUrl: defaultPushApiUrl(),
    updatedAt: now()
  };
}

export async function saveReminderSyncState(patch: Partial<Omit<ReminderSyncState, "id">>) {
  const current = await getReminderSyncState();
  const next = {
    ...current,
    ...patch,
    id: reminderSyncStateId,
    updatedAt: now()
  };

  await db.settings.put(next);
  return next;
}

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  const defaults: AppearanceSettings = {
    id: appearanceSettingsId,
    lowPower3d: false,
    theme: "system",
    showGameLayer: false,
    updatedAt: now()
  };

  const stored = await db.settings.get(appearanceSettingsId);
  if (stored?.id === appearanceSettingsId) {
    // Merge defaults so installs created before new fields existed upgrade cleanly.
    return { ...defaults, ...stored };
  }

  return defaults;
}

export async function saveAppearanceSettings(patch: Partial<Omit<AppearanceSettings, "id">>) {
  const current = await getAppearanceSettings();
  const next = {
    ...current,
    ...patch,
    id: appearanceSettingsId,
    updatedAt: now()
  };

  await db.settings.put(next);
  return next;
}

// ---------------------------------------------------------------------------
// Backup (local JSON export / import)
// ---------------------------------------------------------------------------

const BACKUP_FORMAT = "throughline.backup";

export const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number(),
  exportedAt: z.string(),
  courses: z.array(CourseSchema),
  goals: z.array(GoalSchema),
  notes: z.array(NoteSchema),
  tasks: z.array(TaskSchema)
});

export type Backup = z.infer<typeof BackupSchema>;

/** Serialise all planner content (no device settings) into a portable object. */
export async function exportBackup(): Promise<Backup> {
  const [courses, goals, notes, tasks] = await Promise.all([
    db.courses.toArray(),
    db.goals.toArray(),
    db.notes.toArray(),
    db.tasks.toArray()
  ]);

  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: now(),
    courses,
    goals,
    notes,
    tasks
  };
}

/** Validate and replace all planner content from a backup payload. */
export async function importBackup(raw: unknown): Promise<{ tasks: number; goals: number; notes: number; courses: number }> {
  const backup = BackupSchema.parse(raw);

  await db.transaction("rw", [db.tasks, db.courses, db.goals, db.notes, db.progress], async () => {
    await Promise.all([db.tasks.clear(), db.courses.clear(), db.goals.clear(), db.notes.clear(), db.progress.clear()]);
    await db.courses.bulkPut(backup.courses);
    await db.goals.bulkPut(backup.goals);
    await db.notes.bulkPut(backup.notes);
    await db.tasks.bulkPut(backup.tasks);
    await db.progress.put(deriveUserProgress(backup.tasks));
  });

  return {
    tasks: backup.tasks.length,
    goals: backup.goals.length,
    notes: backup.notes.length,
    courses: backup.courses.length
  };
}

export { clearAllData, resetSampleData } from "./db";
