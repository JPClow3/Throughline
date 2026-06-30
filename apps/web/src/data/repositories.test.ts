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
  syncRecurringTasks,
  recordFocusSession,
  listFocusSessions,
  upsertCourse,
  deleteCourse,
  listCourses,
  exportBackup,
  importBackup,
  getFilterSettings,
  saveFilterSettings
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

  it("records a first-class focus session without creating a completed task", async () => {
    const session = await recordFocusSession({
      durationMinutes: 30,
      taskId: "task_123",
      courseId: "course_123"
    });

    expect(session).toMatchObject({
      title: "Focus Session",
      durationMinutes: 30,
      taskId: "task_123",
      courseId: "course_123"
    });
    expect(await listFocusSessions()).toHaveLength(1);
    const tasks = await listTasks();
    expect(tasks).toHaveLength(0);
  });

  it("includes focus sessions in local backup import and export", async () => {
    const session = await recordFocusSession({ durationMinutes: 25 });
    const backup = await exportBackup();

    expect(backup.focusSessions).toEqual([session]);

    await db.focusSessions.clear();
    expect(await listFocusSessions()).toHaveLength(0);

    await importBackup(backup);

    expect(await listFocusSessions()).toEqual([session]);
  });

  it("persists task filter settings locally", async () => {
    await saveFilterSettings({
      current: {
        search: "biology",
        projectId: "",
        goalId: "",
        dateRange: "today",
        status: "",
        priority: "high",
        tags: ["lab"]
      },
      presets: [
        {
          id: "preset_biology",
          name: "Biology labs",
          filters: {
            search: "biology",
            projectId: "",
            goalId: "",
            dateRange: "all",
            status: "",
            priority: "",
            tags: ["lab"]
          }
        }
      ]
    });

    await db.close();
    await db.open();

    expect(await getFilterSettings()).toMatchObject({
      current: { search: "biology", dateRange: "today", priority: "high", tags: ["lab"] },
      presets: [{ id: "preset_biology", name: "Biology labs" }]
    });
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

  it("does not seed daily quests when bundled sample habits already exist", async () => {
    const { seedIfEmpty, seedDailyQuests } = await import("./db");
    await seedIfEmpty();
    const before = (await listTasks()).filter(t => t?.tags?.includes("habit"));

    await seedDailyQuests();

    const after = (await listTasks()).filter(t => t?.tags?.includes("habit"));
    expect(after.map(t => t.title).sort()).toEqual(before.map(t => t.title).sort());
    expect(after).toHaveLength(2);
  });

  it("does not create duplicate recurring instances for the same next due date", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(19, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    await addTask({
      title: "Review notes for 15 mins",
      priority: "low",
      energy: 2,
      difficulty: 1,
      attributes: ["memory"],
      tags: ["habit"],
      dueAt: yesterday.toISOString(),
      recurrence: { pattern: "daily" }
    });
    await addTask({
      title: "Review notes for 15 mins",
      priority: "low",
      energy: 2,
      difficulty: 1,
      attributes: ["memory"],
      tags: ["habit"],
      dueAt: today.toISOString(),
      recurrence: { pattern: "daily" }
    });

    await syncRecurringTasks();

    const matching = (await listTasks()).filter(t => t.title === "Review notes for 15 mins" && t.dueAt === today.toISOString());
    expect(matching).toHaveLength(1);
  });

  it("upserts and deletes courses correctly", async () => {
    const course = {
      id: "course_1",
      name: "Computer Science",
      code: "CS101",
      color: "#000",
      icon: "💻",
      defaultAttributes: ["focus"] as import("@throughline/domain").RpgAttribute[],
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
