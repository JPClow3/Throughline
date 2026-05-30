import { Task, createRedactedReminders } from "@liquidglass-todo/domain";
import { getReminderSyncState, listTasks, saveReminderSyncState } from "./repositories";
import { ReminderSyncResult } from "./types";

export async function syncRedactedRemindersFromLocalState() {
  const tasks = await listTasks();
  return syncRedactedRemindersForTasks(tasks);
}

export async function syncRedactedRemindersForTasks(
  tasks: Task[],
  options: { pushApiUrl?: string; endpointHash?: string } = {}
): Promise<ReminderSyncResult> {
  const state = await getReminderSyncState();
  const pushApiUrl = options.pushApiUrl ?? state.pushApiUrl;
  const endpointHash = options.endpointHash ?? state.endpointHash;

  if (!pushApiUrl) {
    return { status: "skipped", reason: "missing-api-url" };
  }

  if (!endpointHash) {
    return { status: "skipped", reason: "missing-endpoint" };
  }

  const reminders = createRedactedReminders(tasks);
  try {
    const response = await fetch(`${pushApiUrl.replace(/\/$/, "")}/subscriptions/${endpointHash}/reminders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminders })
    });

    if (!response.ok) {
      throw new Error(`Reminder sync failed with ${response.status}`);
    }

    await saveReminderSyncState({
      pushApiUrl,
      endpointHash,
      lastReminderSyncAt: new Date().toISOString(),
      lastReminderSyncError: undefined
    });

    return { status: "synced", reminderCount: reminders.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reminder sync failed";
    await saveReminderSyncState({
      pushApiUrl,
      endpointHash,
      lastReminderSyncError: message
    });
    return { status: "failed", error: message };
  }
}
