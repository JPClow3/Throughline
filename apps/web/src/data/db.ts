import {
  Course,
  Goal,
  Note,
  sampleCourses,
  sampleGoals,
  sampleNotes,
  sampleTasks,
  Task,
  TaskSchema,
  UserProgress,
  deriveUserProgress
} from "@throughline/domain";
import Dexie, { Table } from "dexie";
import { AppSetting } from "./types";

export type SyncEntity = "task" | "course" | "goal" | "note";

/** Records a deletion so it can propagate to other devices during sync. */
export type Tombstone = {
  key: string; // `${entity}:${id}`
  entity: SyncEntity;
  id: string;
  deletedAt: string;
};

class LiquidGlassDb extends Dexie {
  tasks!: Table<Task, string>;
  courses!: Table<Course, string>;
  progress!: Table<UserProgress, string>;
  settings!: Table<AppSetting, string>;
  goals!: Table<Goal, string>;
  notes!: Table<Note, string>;
  tombstones!: Table<Tombstone, string>;

  constructor() {
    super("liquidglass-study-quests");
    this.version(1).stores({
      tasks: "id,status,courseId,dueAt,priority,updatedAt",
      courses: "id,name,code",
      progress: "id"
    });
    this.version(2).stores({
      tasks: "id,status,courseId,dueAt,priority,updatedAt",
      courses: "id,name,code",
      progress: "id",
      settings: "id,updatedAt"
    });
    this.version(3).stores({
      tasks: "id,status,courseId,goalId,dueAt,priority,updatedAt",
      courses: "id,name,code",
      progress: "id",
      settings: "id,updatedAt",
      goals: "id,status,projectId,targetDate,updatedAt"
    });
    this.version(4).stores({
      tasks: "id,status,courseId,goalId,dueAt,priority,updatedAt",
      courses: "id,name,code",
      progress: "id",
      settings: "id,updatedAt",
      goals: "id,status,projectId,targetDate,updatedAt",
      notes: "id,pinned,projectId,updatedAt,*taskIds,*goalIds"
    });
    this.version(5)
      .stores({
        tasks: "id,status,courseId,goalId,dueAt,priority,updatedAt",
        courses: "id,name,code,updatedAt",
        progress: "id",
        settings: "id,updatedAt",
        goals: "id,status,projectId,targetDate,updatedAt",
        notes: "id,pinned,projectId,updatedAt,*taskIds,*goalIds",
        tombstones: "key,entity,deletedAt"
      })
      .upgrade(async (tx) => {
        // Backfill timestamps on existing courses so they participate in sync.
        const now = new Date().toISOString();
        await tx
          .table("courses")
          .toCollection()
          .modify((course: Partial<Course>) => {
            if (!course.createdAt) course.createdAt = now;
            if (!course.updatedAt) course.updatedAt = now;
          });
      });
  }
}

export const db = new LiquidGlassDb();

export async function seedIfEmpty() {
  const taskCount = await db.tasks.count();
  if (taskCount > 0) {
    return;
  }

  await db.transaction("rw", [db.tasks, db.courses, db.progress, db.goals, db.notes], async () => {
    await db.courses.bulkPut(sampleCourses);
    await db.goals.bulkPut(sampleGoals);
    await db.notes.bulkPut(sampleNotes);
    await db.tasks.bulkPut(sampleTasks.map((task) => TaskSchema.parse(task)));
    await db.progress.put(deriveUserProgress(sampleTasks));
  });
}

export async function refreshProgress() {
  const tasks = await db.tasks.toArray();
  await db.progress.put(deriveUserProgress(tasks));
}

/** Wipe planner content (keeps device settings like theme + reminder sync). */
export async function clearAllData() {
  await db.transaction("rw", [db.tasks, db.courses, db.progress, db.goals, db.notes, db.tombstones], async () => {
    await Promise.all([
      db.tasks.clear(),
      db.courses.clear(),
      db.goals.clear(),
      db.notes.clear(),
      db.progress.clear(),
      db.tombstones.clear()
    ]);
  });
}

/** Replace all planner content with the bundled sample data. */
export async function resetSampleData() {
  await db.transaction("rw", [db.tasks, db.courses, db.progress, db.goals, db.notes, db.tombstones], async () => {
    await Promise.all([
      db.tasks.clear(),
      db.courses.clear(),
      db.goals.clear(),
      db.notes.clear(),
      db.progress.clear(),
      db.tombstones.clear()
    ]);
    await db.courses.bulkPut(sampleCourses);
    await db.goals.bulkPut(sampleGoals);
    await db.notes.bulkPut(sampleNotes);
    await db.tasks.bulkPut(sampleTasks.map((task) => TaskSchema.parse(task)));
    await db.progress.put(deriveUserProgress(sampleTasks));
  });
}
