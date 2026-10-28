import type { Task } from "@throughline/domain";
import { showLocalQuestNotification } from "./notifications";

const STORAGE_PREFIX = "throughline:local-reminder:";

function firedKey(taskId: string, reminderAt: string) {
  return `${STORAGE_PREFIX}${taskId}:${reminderAt}`;
}

function hasFired(taskId: string, reminderAt: string) {
  try {
    return sessionStorage.getItem(firedKey(taskId, reminderAt)) === "1";
  } catch {
    return false;
  }
}

function markFired(taskId: string, reminderAt: string) {
  try {
    sessionStorage.setItem(firedKey(taskId, reminderAt), "1");
  } catch {
    // sessionStorage may be unavailable in private modes; skip dedupe.
  }
}

function canNotify() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

/** Fire a generic local reminder once per task+reminderAt for this browsing session. */
export function fireLocalReminder(taskId: string, reminderAt: string) {
  if (!canNotify() || hasFired(taskId, reminderAt)) {
    return false;
  }
  const shown = showLocalQuestNotification();
  if (shown) {
    markFired(taskId, reminderAt);
  }
  return shown;
}

/**
 * Schedule browser notifications for incomplete tasks with `reminderAt`.
 * Returns a disposer that clears pending timeouts.
 */
export function scheduleLocalReminders(tasks: Task[]): () => void {
  if (!canNotify()) {
    return () => undefined;
  }

  const timers: number[] = [];
  const now = Date.now();

  for (const task of tasks) {
    if (task.status === "done" || !task.reminderAt) {
      continue;
    }
    const at = new Date(task.reminderAt).getTime();
    if (Number.isNaN(at) || hasFired(task.id, task.reminderAt)) {
      continue;
    }

    // Already due: notify on the next tick so load stays responsive.
    const delay = Math.max(0, at - now);
    if (delay > 7 * 24 * 60 * 60 * 1000) {
      // Skip timers more than a week out; the next task change re-schedules.
      continue;
    }

    const timer = window.setTimeout(() => {
      fireLocalReminder(task.id, task.reminderAt!);
    }, delay);
    timers.push(timer);
  }

  return () => {
    for (const timer of timers) {
      window.clearTimeout(timer);
    }
  };
}
