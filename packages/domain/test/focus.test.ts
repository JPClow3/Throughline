import { describe, expect, it } from "vitest";
import { createCourse, createFocusSession, createTask, deriveCoachingInsights, deriveTodayBriefing, deriveTodayStats, type Task } from "../src";

describe("focus sessions and Today metrics", () => {
  it("creates a first-class focus session with task context", () => {
    const session = createFocusSession({
      title: "Biology review",
      taskId: "task_1",
      courseId: "course_bio",
      goalId: "goal_exam",
      startedAt: "2026-06-28T13:00:00.000Z",
      endedAt: "2026-06-28T13:25:00.000Z",
      durationMinutes: 25
    });

    expect(session).toMatchObject({
      title: "Biology review",
      taskId: "task_1",
      courseId: "course_bio",
      goalId: "goal_exam",
      durationMinutes: 25
    });
    expect(session.id).toMatch(/^focus_/);
  });

  it("derives Today from real tasks, focus sessions, and legacy focus logs", () => {
    const now = new Date(2026, 5, 28, 15, 0, 0, 0);
    const biologyTask = createTask({
      id: "task_bio",
      title: "Finish biology lab",
      status: "done",
      courseId: "course_bio",
      dueAt: "2026-06-28T20:00:00.000Z",
      estimatedMinutes: 50,
      completedAt: "2026-06-28T14:00:00.000Z"
    });
    const overdue = createTask({
      id: "task_overdue",
      title: "Submit paper outline",
      status: "ready",
      dueAt: "2026-06-27T20:00:00.000Z",
      estimatedMinutes: 45
    });
    const upcoming = createTask({
      id: "task_next",
      title: "Read chapter 4",
      status: "ready",
      dueAt: "2026-06-28T18:00:00.000Z",
      estimatedMinutes: 35
    });
    const legacyFocus = createTask({
      id: "task_legacy_focus",
      title: "Focus Session",
      status: "done",
      tags: ["focus"],
      estimatedMinutes: 30,
      completedAt: "2026-06-28T12:00:00.000Z"
    });

    const stats = deriveTodayStats({
      tasks: [biologyTask, overdue, upcoming, legacyFocus],
      focusSessions: [
        createFocusSession({
          startedAt: "2026-06-28T13:00:00.000Z",
          endedAt: "2026-06-28T13:25:00.000Z",
          durationMinutes: 25
        })
      ],
      now
    });

    expect(stats.focusMinutesToday).toBe(55);
    expect(stats.completedTasksToday).toBe(1);
    expect(stats.todayTaskTotal).toBe(2);
    expect(stats.overdueCount).toBe(1);
    expect(stats.nextStudyBlock?.task.id).toBe("task_next");
    expect(stats.completedByDay.at(-1)).toMatchObject({ count: 1, focusMinutes: 55 });
  });

  it("keeps Today metrics finite for legacy tasks without estimated minutes", () => {
    const now = new Date("2026-06-28T15:00:00.000Z");
    const legacyDueTask = {
      ...createTask({
        id: "task_due_legacy",
        title: "Legacy due task",
        status: "ready",
        dueAt: "2026-06-28T18:00:00.000Z"
      }),
      estimatedMinutes: undefined
    } as unknown as Task;
    const legacyFocusTask = {
      ...createTask({
        id: "task_focus_legacy",
        title: "Focus Session",
        status: "done",
        tags: ["focus"],
        completedAt: "2026-06-28T12:00:00.000Z"
      }),
      estimatedMinutes: undefined
    } as unknown as Task;

    const stats = deriveTodayStats({
      tasks: [legacyDueTask, legacyFocusTask],
      focusSessions: [],
      now
    });

    expect(stats.plannedStudyMinutesToday).toBe(0);
    expect(stats.nextStudyBlock?.minutes).toBe(0);
    expect(stats.completedByDay.at(-1)?.focusMinutes).toBe(0);
  });

  it("derives calm coaching prompts from project load, completion timing, and orphaned overdue work", () => {
    const biology = createCourse({ id: "course_bio", name: "Biology", color: "#2fa980", icon: "B" });
    const literature = createCourse({ id: "course_lit", name: "Literature", color: "#5b73f0", icon: "L" });
    const now = new Date("2026-06-28T15:00:00.000Z");
    const completed = [
      createTask({ title: "Bio lab", status: "done", courseId: biology.id, estimatedMinutes: 60, completedAt: "2026-06-28T09:00:00.000Z" }),
      createTask({ title: "Bio quiz", status: "done", courseId: biology.id, estimatedMinutes: 45, completedAt: "2026-06-27T10:00:00.000Z" }),
      createTask({ title: "Lit notes", status: "done", courseId: literature.id, estimatedMinutes: 15, completedAt: "2026-06-26T15:00:00.000Z" })
    ];
    const overdueNoProject = [0, 1, 2].map((index) =>
      createTask({
        title: `Overdue ${index}`,
        status: "ready",
        dueAt: "2026-06-26T17:00:00.000Z"
      })
    );

    const insights = deriveCoachingInsights({
      tasks: [...completed, ...overdueNoProject],
      courses: [biology, literature],
      focusSessions: [],
      now
    });

    expect(insights.map((insight) => insight.message)).toContain("Biology is carrying most of this week.");
    expect(insights.map((insight) => insight.message)).toContain("You complete more tasks before noon.");
    expect(insights.map((insight) => insight.message)).toContain("Three overdue tasks have no project.");
  });

  it("keeps coaching effort finite for legacy completions without estimated minutes", () => {
    const biology = createCourse({ id: "course_bio", name: "Biology", color: "#2fa980", icon: "B" });
    const legacyCompleted = {
      ...createTask({
        title: "Legacy completion",
        status: "done",
        courseId: biology.id,
        completedAt: "2026-06-28T09:00:00.000Z"
      }),
      estimatedMinutes: undefined
    } as unknown as Task;

    const insights = deriveCoachingInsights({
      tasks: [legacyCompleted],
      courses: [biology],
      focusSessions: [],
      now: new Date("2026-06-28T15:00:00.000Z")
    });

    expect(insights).toEqual([]);
  });

  it("builds a calm Today briefing with prioritized tasks and human guidance", () => {
    const now = new Date("2026-06-28T15:00:00.000Z");
    const overdue = createTask({
      id: "task_overdue",
      title: "Submit paper outline",
      status: "ready",
      priority: "medium",
      dueAt: new Date(2026, 5, 27, 20, 0, 0, 0).toISOString()
    });
    const physics = createTask({
      id: "task_physics",
      title: "Physics problem set",
      status: "doing",
      priority: "high",
      dueAt: new Date(2026, 5, 28, 18, 0, 0, 0).toISOString()
    });
    const blocked = createTask({
      id: "task_blocked",
      title: "Ask professor about lab data",
      status: "blocked",
      dueAt: new Date(2026, 5, 28, 20, 0, 0, 0).toISOString()
    });
    const later = createTask({
      id: "task_later",
      title: "Read chapter 4",
      status: "ready",
      dueAt: new Date(2026, 6, 1, 18, 0, 0, 0).toISOString()
    });

    const briefing = deriveTodayBriefing({
      tasks: [later, blocked, physics, overdue],
      focusSessions: [],
      now
    });

    expect(briefing.progressSentence).toBe("0 of 2 tasks done. Keep it quiet and steady.");
    expect(briefing.priorityTasks.map((task) => task.id).slice(0, 3)).toEqual(["task_physics", "task_overdue", "task_blocked"]);
    expect(briefing.nextTask?.id).toBe("task_physics");
    expect(briefing.dueBefore).toBe("18:00");
    expect(briefing.blockedCount).toBe(1);
    expect(briefing.guidance.map((item) => item.message)).toEqual(
      expect.arrayContaining([
        "Start with Physics problem set",
        "1 task is due before 18:00",
        "1 task is overdue",
        "One task is blocked"
      ])
    );
    expect(briefing.guidance.some((item) => item.kind === "focus" && item.message.includes("clear block"))).toBe(true);
  });

  it("briefs an empty day without manufacturing dashboard stats", () => {
    const briefing = deriveTodayBriefing({
      tasks: [],
      focusSessions: [],
      now: new Date("2026-06-28T15:00:00.000Z")
    });

    expect(briefing.progressSentence).toBe("A clear day. Capture one thing if it matters.");
    expect(briefing.priorityTasks).toEqual([]);
    expect(briefing.guidance).toEqual([]);
  });
});
