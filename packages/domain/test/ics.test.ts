import { describe, expect, it } from "vitest";
import { exportTasksToIcs } from "../src/ics";
import { sampleCourses, sampleTasks } from "../src/sample-data";

describe("ICS export", () => {
  it("creates a valid calendar with due tasks", () => {
    const customTasks = [
      ...sampleTasks,
      {
        id: "task_with_due",
        title: "Submit assignment",
        description: "Submit to portal",
        status: "doing",
        xp: 100,
        dueAt: "2026-10-31T23:59:00.000Z",
        tags: ["urgent"],
        attributes: [],
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
        goalId: null,
        order: 0,
        energy: 1,
        priority: "high",
        estimatedMinutes: 60,
        difficulty: 1
      },
      {
        id: "task_with_due_and_course",
        title: "Read chapter 5",
        description: "",
        status: "todo",
        xp: 50,
        dueAt: "2026-11-01T12:00:00.000Z",
        tags: [],
        attributes: [],
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
        goalId: null,
        order: 0,
        energy: 1,
        priority: "medium",
        estimatedMinutes: 30,
        difficulty: 1,
        courseId: "course_1"
      }
    ] as import("../src/types").Task[];

    const customCourses = [
      ...sampleCourses,
      {
        id: "course_1",
        name: "History",
        code: "HIST101",
        color: "blue",
        credits: 3
      }
    ] as import("../src/types").Course[];

    const ics = exportTasksToIcs(customTasks, { courses: customCourses });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("Submit assignment");
    expect(ics).toContain("HIST101: Read chapter 5");
    expect(ics).toContain("END:VCALENDAR");
  });
});
