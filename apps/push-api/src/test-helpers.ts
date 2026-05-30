import { RedactedReminder } from "@throughline/domain";
import { WebPushSubscription } from "./store";

export function fakeSubscription(endpoint = "https://push.example.test/subscription/1"): WebPushSubscription {
  return {
    endpoint,
    expirationTime: null,
    keys: {
      p256dh: "p256dh-key",
      auth: "auth-key"
    }
  };
}

export function fakeReminder(overrides: Partial<RedactedReminder> = {}): RedactedReminder {
  return {
    reminderId: "reminder_task_1",
    taskId: "task_1",
    dueAt: "2026-05-29T20:00:00.000Z",
    notifyAt: "2026-05-29T18:00:00.000Z",
    urgency: "high",
    title: "Quest reminder",
    body: "A study quest needs your attention.",
    createdAt: "2026-05-29T12:00:00.000Z",
    ...overrides
  };
}
