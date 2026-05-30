import { RedactedReminder, RedactedReminderSchema, Task } from "./types";

type ReminderTask = Pick<Task, "id" | "dueAt" | "reminderAt" | "priority" | "status">;

export function createRedactedReminder(task: ReminderTask): RedactedReminder | null {
  const notifyAt = task.reminderAt ?? task.dueAt;

  if (task.status === "done" || !notifyAt) {
    return null;
  }

  const urgency = task.priority === "critical" ? "critical" : task.priority === "high" ? "high" : "normal";

  return RedactedReminderSchema.parse({
    reminderId: `reminder_${task.id}`,
    taskId: task.id,
    dueAt: task.dueAt,
    notifyAt,
    urgency,
    title: "Quest reminder",
    body: "A study quest needs your attention.",
    createdAt: new Date().toISOString()
  });
}

export function createRedactedReminders(tasks: ReminderTask[]): RedactedReminder[] {
  return tasks.map((task) => createRedactedReminder(task)).filter(Boolean) as RedactedReminder[];
}
