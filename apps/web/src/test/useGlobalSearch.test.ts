import { describe, expect, it } from "vitest";
import { CourseSchema, GoalSchema, NoteSchema, TaskSchema } from "@throughline/domain";
import { buildGlobalSearchResults } from "../hooks/useGlobalSearch";

describe("buildGlobalSearchResults", () => {
  it("returns jump targets across tasks, notes, goals, and projects", () => {
    const timestamp = "2026-06-28T12:00:00.000Z";
    const results = buildGlobalSearchResults({
      query: "biology",
      tasks: [
        TaskSchema.parse({
          id: "task_1",
          title: "Finish biology lab",
          description: "Microscope notes",
          status: "ready",
          tags: ["lab"],
          subtasks: [],
          createdAt: timestamp,
          updatedAt: timestamp
        })
      ],
      notes: [
        NoteSchema.parse({
          id: "note_1",
          title: "Lecture notes",
          body: "Biology chapter summary",
          taskIds: [],
          goalIds: [],
          createdAt: timestamp,
          updatedAt: timestamp
        })
      ],
      goals: [
        GoalSchema.parse({
          id: "goal_1",
          title: "Biology midterm",
          summary: "Prepare for exam",
          createdAt: timestamp,
          updatedAt: timestamp
        })
      ],
      courses: [
        CourseSchema.parse({
          id: "course_1",
          name: "Biology",
          code: "BIO",
          color: "#2fa980",
          icon: "B",
          createdAt: timestamp,
          updatedAt: timestamp
        })
      ]
    });

    expect(results.map((result) => `${result.type}:${result.id}`)).toEqual([
      "task:task_1",
      "note:note_1",
      "goal:goal_1",
      "project:course_1"
    ]);
    expect(results[0]).toMatchObject({ title: "Finish biology lab", view: "kanban" });
    expect(results[0]).toMatchObject({ groupLabel: "Tasks", actionLabel: "Open task" });
  });

  it("returns recent items before typing", () => {
    const older = "2026-06-27T12:00:00.000Z";
    const newer = "2026-06-28T12:00:00.000Z";
    const results = buildGlobalSearchResults({
      query: "",
      tasks: [
        TaskSchema.parse({
          id: "task_old",
          title: "Older task",
          status: "ready",
          tags: [],
          subtasks: [],
          createdAt: older,
          updatedAt: older
        })
      ],
      notes: [
        NoteSchema.parse({
          id: "note_new",
          title: "Recent lecture note",
          body: "",
          taskIds: [],
          goalIds: [],
          createdAt: newer,
          updatedAt: newer
        })
      ],
      goals: [],
      courses: []
    });

    expect(results.map((result) => result.id)).toEqual(["note_new", "task_old"]);
    expect(results[0]).toMatchObject({ groupLabel: "Recent", actionLabel: "Open note" });
  });
});
