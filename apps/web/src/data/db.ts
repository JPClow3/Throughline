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
} from "@liquidglass-todo/domain";
import Dexie, { Table } from "dexie";
import { AppSetting } from "./types";

class LiquidGlassDb extends Dexie {
  tasks!: Table<Task, string>;
  courses!: Table<Course, string>;
  progress!: Table<UserProgress, string>;
  settings!: Table<AppSetting, string>;
  goals!: Table<Goal, string>;
  notes!: Table<Note, string>;

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
  await db.transaction("rw", [db.tasks, db.courses, db.progress, db.goals, db.notes], async () => {
    await Promise.all([db.tasks.clear(), db.courses.clear(), db.goals.clear(), db.notes.clear(), db.progress.clear()]);
  });
}

/** Replace all planner content with the bundled sample data. */
export async function resetSampleData() {
  await db.transaction("rw", [db.tasks, db.courses, db.progress, db.goals, db.notes], async () => {
    await Promise.all([db.tasks.clear(), db.courses.clear(), db.goals.clear(), db.notes.clear(), db.progress.clear()]);
    await db.courses.bulkPut(sampleCourses);
    await db.goals.bulkPut(sampleGoals);
    await db.notes.bulkPut(sampleNotes);
    await db.tasks.bulkPut(sampleTasks.map((task) => TaskSchema.parse(task)));
    await db.progress.put(deriveUserProgress(sampleTasks));
  });
}
