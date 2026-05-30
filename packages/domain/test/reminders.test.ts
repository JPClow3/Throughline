import { describe, expect, it } from "vitest";
import { createRedactedReminder, createRedactedReminders } from "../src/reminders";
import { sampleTasks } from "../src/sample-data";

describe("redacted reminders", () => {
  it("does not copy task title or description into push payloads", () => {
    const task = sampleTasks[0];
    const reminder = createRedactedReminder(task);

    expect(reminder?.taskId).toBe(task.id);
    expect(reminder?.title).toBe("Quest reminder");
    expect(JSON.stringify(reminder)).not.toContain(task.title);
    expect(JSON.stringify(reminder)).not.toContain(task.description);
  });

  it("uses reminderAt before dueAt for notification dispatch", () => {
    const task = {
      ...sampleTasks[0],
      dueAt: "2026-05-29T20:00:00.000Z",
      reminderAt: "2026-05-29T18:00:00.000Z"
    };

    expect(createRedactedReminder(task)?.dueAt).toBe("2026-05-29T20:00:00.000Z");
    expect(createRedactedReminder(task)?.notifyAt).toBe("2026-05-29T18:00:00.000Z");
  });

  it("filters completed tasks from reminder sync payloads", () => {
    const reminders = createRedactedReminders(sampleTasks);

    expect(reminders.some((reminder) => reminder.taskId === "task_renew_passport")).toBe(false);
  });
});
