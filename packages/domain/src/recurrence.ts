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
    case "custom": {
      const days = (recurrence.daysOfWeek ?? [])
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b);
      if (!days.length) {
        // No weekdays selected: preserve prior daily-interval fallback.
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      }
      const advanced = nextCustomWeekday(baseDate, days, Math.max(1, interval));
      nextDate.setTime(advanced.getTime());
      break;
    }
  }

  if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
    return undefined;
  }

  return nextDate.toISOString();
}

/** Next occurrence on selected weekdays, every `interval` weeks (RRULE-style). */
function nextCustomWeekday(baseDate: Date, days: number[], interval: number): Date {
  const baseWeekStart = startOfWeekSunday(baseDate).getTime();
  const horizon = interval * 7 + 7;

  for (let offset = 1; offset <= horizon; offset += 1) {
    const candidate = new Date(baseDate);
    candidate.setDate(baseDate.getDate() + offset);
    if (!days.includes(candidate.getDay())) {
      continue;
    }
    if (interval <= 1) {
      return candidate;
    }
    const weekDiff = Math.round((startOfWeekSunday(candidate).getTime() - baseWeekStart) / (7 * 86_400_000));
    if (weekDiff % interval === 0) {
      return candidate;
    }
  }

  // Safety: jump a full interval week and land on the first selected weekday.
  const fallback = new Date(baseDate);
  fallback.setDate(baseDate.getDate() + 7 * interval);
  while (!days.includes(fallback.getDay())) {
    fallback.setDate(fallback.getDate() + 1);
  }
  return fallback;
}

function startOfWeekSunday(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}
