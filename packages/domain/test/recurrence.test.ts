import { expect, test } from "vitest";
import { calculateNextRecurrence } from "../src/recurrence";

test("calculateNextRecurrence - daily", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "daily", interval: 1 });
  expect(new Date(next!).getDate()).toBe(2);
});

test("calculateNextRecurrence - weekly", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "weekly", interval: 1 });
  expect(new Date(next!).getDate()).toBe(8);
});

test("calculateNextRecurrence - biweekly", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "biweekly", interval: 1 });
  expect(new Date(next!).getDate()).toBe(15);
});

test("calculateNextRecurrence - monthly", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "monthly", interval: 1 });
  expect(new Date(next!).getMonth()).toBe(1);
});

test("calculateNextRecurrence - custom without days falls back to daily interval", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "custom", interval: 2 });
  expect(new Date(next!).getDate()).toBe(3);
});

test("calculateNextRecurrence - custom weekdays picks the next selected day", () => {
  // Local Sunday 2023-01-01 → next Mon/Wed is Monday the 2nd
  const base = new Date(2023, 0, 1, 10, 0, 0);
  const next = calculateNextRecurrence(base.toISOString(), {
    pattern: "custom",
    daysOfWeek: [1, 3]
  });
  const nextDate = new Date(next!);
  expect(nextDate.getDay()).toBe(1);
  expect(nextDate.getDate()).toBe(2);
});

test("calculateNextRecurrence - custom weekdays with interval skips intervening weeks", () => {
  // Local Monday 2023-01-02; interval 2 → next Monday is 2023-01-16
  const base = new Date(2023, 0, 2, 10, 0, 0);
  const next = calculateNextRecurrence(base.toISOString(), {
    pattern: "custom",
    interval: 2,
    daysOfWeek: [1]
  });
  const nextDate = new Date(next!);
  expect(nextDate.getFullYear()).toBe(2023);
  expect(nextDate.getMonth()).toBe(0);
  expect(nextDate.getDate()).toBe(16);
  expect(nextDate.getDay()).toBe(1);
});

test("calculateNextRecurrence - past end date", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { 
    pattern: "daily", 
    interval: 1,
    endDate: new Date("2020-01-01T10:00:00Z").toISOString()
  });
  expect(next).toBeUndefined();
});

test("calculateNextRecurrence - default base date", () => {
  const next = calculateNextRecurrence(undefined, { pattern: "daily", interval: 1 });
  expect(next).toBeDefined();
});
