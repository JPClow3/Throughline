import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { syncRedactedRemindersFromLocalState } from "./reminderSync";
import {
  addTask,
  getProgress,
  getReminderSyncState,
  listTasks,
  saveReminderSyncState,
  updateTaskStatus,
  recordFocusSession,
  upsertCourse,
  deleteCourse,
  listCourses
} from "./repositories";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db.delete();
});

describe("web data repositories", () => {
  it("updates progress after local task completion", async () => {
    const task = await addTask({
      title: "Read systems chapter",
      priority: "high",
      energy: 3,
      difficulty: 3,
      attributes: ["focus"],
      dueAt: "2026-05-29T20:00:00.000Z"
    });

    expect((await getProgress()).xp).toBe(0);

    await updateTaskStatus(task.id, "done");

    expect((await getProgress()).xp).toBeGreaterThan(0);
  });

  it("persists reminder sync state locally", async () => {
    await saveReminderSyncState({
      pushApiUrl: "http://127.0.0.1:8787",
      endpointHash: "hash_123",
      lastReminderSyncAt: "2026-05-29T20:00:00.000Z"
    });

    await db.close();
    await db.open();

    expect(await getReminderSyncState()).toMatchObject({
      pushApiUrl: "http://127.0.0.1:8787",
      endpointHash: "hash_123",
      lastReminderSyncAt: "2026-05-29T20:00:00.000Z"
    });
  });

  it("does not roll back local task writes when reminder sync fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );
    await saveReminderSyncState({
      pushApiUrl: "http://127.0.0.1:8787",
      endpointHash: "endpoint-hash"
    });
    await addTask({
      title: "Prepare exam review",
      priority: "critical",
      energy: 4,
      difficulty: 4,
      attributes: ["discipline"],
      dueAt: "2026-05-29T20:00:00.000Z"
    });

    const syncResult = await syncRedactedRemindersFromLocalState();

    expect(syncResult.status).toBe("failed");
    expect(await listTasks()).toHaveLength(1);
    expect((await getReminderSyncState()).lastReminderSyncError).toContain("500");
  });

  it("syncs an empty reminder replacement to clear remote stale reminders", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await saveReminderSyncState({
      pushApiUrl: "http://127.0.0.1:8787",
      endpointHash: "endpoint-hash"
    });

    const syncResult = await syncRedactedRemindersFromLocalState();

    expect(syncResult).toEqual({ status: "synced", reminderCount: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8787/subscriptions/endpoint-hash/reminders",
      expect.objectContaining({
        body: JSON.stringify({ reminders: [] })
      })
    );
  });

  it("records a focus session task", async () => {
    const task = await recordFocusSession(30);
    expect(task.title).toBe("Focus Session");
    expect(task.status).toBe("done");
    expect(task.estimatedMinutes).toBe(30);
    expect(task.energy).toBe(3);
    const tasks = await listTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
  });

  it("seeds daily quests when empty", async () => {
    const { seedDailyQuests } = await import("./db");
    await seedDailyQuests();
    const tasks = await listTasks();
    const habitTasks = tasks.filter(t => t?.tags?.includes("habit"));
    expect(habitTasks).toHaveLength(2);

    await seedDailyQuests(); // second call should not add duplicates
    const tasksAfter = await listTasks();
    const habitTasksAfter = tasksAfter.filter(t => t?.tags?.includes("habit"));
    expect(habitTasksAfter).toHaveLength(2);
  });

  it("upserts and deletes courses correctly", async () => {
    const course = {
      id: "course_1",
      name: "Computer Science",
      code: "CS101",
      color: "#000",
      icon: "💻",
      defaultAttributes: ["focus"] as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await upsertCourse(course);
    let courses = await listCourses();
    expect(courses).toHaveLength(1);
    
    await addTask({
      title: "Assignment 1",
      courseId: "course_1",
      priority: "high",
      energy: 2,
      difficulty: 2,
      attributes: ["focus"]
    });
    
    await deleteCourse("course_1");
    courses = await listCourses();
    expect(courses).toHaveLength(0);
    const tasks = await listTasks();
    expect(tasks[0].courseId).toBeUndefined(); // detached
  });
});
