import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { syncRedactedRemindersFromLocalState } from "./reminderSync";
import {
  addTask,
  getProgress,
  getReminderSyncState,
  listTasks,
  saveReminderSyncState,
  updateTaskStatus
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
});
