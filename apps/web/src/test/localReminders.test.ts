import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskSchema } from "@throughline/domain";
import { fireLocalReminder, scheduleLocalReminders } from "../lib/localReminders";

function makeTask(reminderAt: string, status: "ready" | "done" = "ready") {
  const timestamp = new Date().toISOString();
  return TaskSchema.parse({
    id: "task-1",
    title: "Study",
    status,
    priority: "medium",
    difficulty: 2,
    energy: 2,
    reminderAt,
    tags: [],
    subtasks: [],
    attributes: ["focus"],
    order: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

describe("localReminders", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    Object.defineProperty(window, "Notification", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(function NotificationMock() {
        return {};
      })
    });
    (window.Notification as unknown as { permission: NotificationPermission }).permission = "granted";
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it("fires once per task reminder in a session", () => {
    const reminderAt = new Date(Date.now() - 1000).toISOString();
    expect(fireLocalReminder("task-1", reminderAt)).toBe(true);
    expect(fireLocalReminder("task-1", reminderAt)).toBe(false);
    expect(window.Notification).toHaveBeenCalledTimes(1);
  });

  it("schedules future reminders and skips completed tasks", () => {
    const soon = new Date(Date.now() + 5_000).toISOString();
    const dispose = scheduleLocalReminders([makeTask(soon), makeTask(soon, "done")]);
    vi.advanceTimersByTime(4_999);
    expect(window.Notification).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(window.Notification).toHaveBeenCalledTimes(1);
    dispose();
  });
});
