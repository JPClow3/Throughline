import { describe, expect, it } from "vitest";
import { createGoal, createTask } from "../src/factories";
import { deriveGoalProgress, nextGoalTaskOrder, tasksForGoal } from "../src/goals";

describe("goals", () => {
  it("derives roll-up progress from child tasks", () => {
    const tasks = [
      createTask({ title: "A1", goalId: "g1", order: 0, status: "done" }),
      createTask({ title: "A2", goalId: "g1", order: 1, status: "doing" }),
      createTask({ title: "A3", goalId: "g1", order: 2 }),
      createTask({ title: "A4", goalId: "g1", order: 3 }),
      createTask({ title: "Unrelated" })
    ];

    const progress = deriveGoalProgress("g1", tasks);

    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(1);
    expect(progress.remaining).toBe(3);
    expect(progress.ratio).toBe(25);
    expect(progress.isComplete).toBe(false);
  });

  it("marks a goal complete only when every child task is done", () => {
    const tasks = [
      createTask({ title: "A1", goalId: "g1", status: "done" }),
      createTask({ title: "A2", goalId: "g1", status: "done" })
    ];

    expect(deriveGoalProgress("g1", tasks).isComplete).toBe(true);
  });

  it("treats a goal with no child tasks as empty, not complete", () => {
    expect(deriveGoalProgress("g1", [])).toMatchObject({ total: 0, ratio: 0, isComplete: false });
  });

  it("orders child tasks by order then creation time", () => {
    const tasks = [
      createTask({ title: "second", goalId: "g1", order: 1 }),
      createTask({ title: "first", goalId: "g1", order: 0 })
    ];

    expect(tasksForGoal("g1", tasks).map((task) => task.title)).toEqual(["first", "second"]);
  });

  it("computes the next order at the end of a goal's list", () => {
    const tasks = [
      createTask({ title: "a", goalId: "g1", order: 0 }),
      createTask({ title: "b", goalId: "g1", order: 2 })
    ];

    expect(nextGoalTaskOrder("g1", tasks)).toBe(3);
    expect(nextGoalTaskOrder("empty", tasks)).toBe(0);
  });

  it("creates a goal with calm defaults", () => {
    const goal = createGoal({ title: "Finish the thesis" });

    expect(goal.id).toMatch(/^goal_/);
    expect(goal.status).toBe("active");
    expect(goal.priority).toBe("medium");
    expect(goal.summary).toBe("");
  });
});
