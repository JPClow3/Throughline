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

test("calculateNextRecurrence - custom", () => {
  const base = new Date("2023-01-01T10:00:00Z");
  const next = calculateNextRecurrence(base.toISOString(), { pattern: "custom", interval: 2 });
  expect(new Date(next!).getDate()).toBe(3);
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
