import { RecurrencePattern } from "./types";

/**
 * Calculates the next due date based on the current due date and the recurrence pattern.
 * If no due date is provided, it defaults to the current date.
 */
export function calculateNextRecurrence(currentDueAt: string | undefined, recurrence: RecurrencePattern): string | undefined {
  if (recurrence.endDate && new Date() > new Date(recurrence.endDate)) {
    return undefined;
  }

  const baseDate = currentDueAt ? new Date(currentDueAt) : new Date();
  const nextDate = new Date(baseDate);

  const interval = recurrence.interval ?? 1;

  switch (recurrence.pattern) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14 * interval);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case "custom":
      // Fallback for custom without daysOfWeek implementation: just daily
      nextDate.setDate(nextDate.getDate() + interval);
      break;
  }

  if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
    return undefined;
  }

  return nextDate.toISOString();
}
