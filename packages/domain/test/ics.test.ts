import { describe, expect, it } from "vitest";
import { exportTasksToIcs } from "../src/ics";
import { sampleCourses, sampleTasks } from "../src/sample-data";

describe("ICS export", () => {
  it("creates a valid calendar with due tasks", () => {
    const ics = exportTasksToIcs(sampleTasks, { courses: sampleCourses });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("Side project: Wire up the landing page");
    expect(ics).toContain("END:VCALENDAR");
  });
});
