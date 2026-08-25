import { TaskSchema } from "@throughline/domain";
import { describe, expect, it } from "vitest";
import { BoardMoveEntry, compareBoardTasks, planBoardMove } from "../lib/board";

const T = "2026-06-01T00:00:00.000Z";

function task(id: string, overrides: Record<string, unknown> = {}) {
  return TaskSchema.parse({
    id,
    title: `Task ${id}`,
    status: "backlog",
    tags: [],
    subtasks: [],
    createdAt: T,
    updatedAt: T,
    ...overrides
  });
}

function entry(taskId: string, status: string, order: number): BoardMoveEntry {
  return { taskId, status: status as BoardMoveEntry["status"], order };
}

describe("compareBoardTasks", () => {
  it("orders by explicit order, then most recently touched first", () => {
    const a = task("a", { order: 1 });
    const b = task("b", { order: 0 });
    const c = task("c", { order: 0, updatedAt: "2026-06-02T00:00:00.000Z" });
    const d = task("d", { order: 0 });

    expect([a, b].sort(compareBoardTasks).map((item) => item.id)).toEqual(["b", "a"]);
    expect([d, c].sort(compareBoardTasks).map((item) => item.id)).toEqual(["c", "d"]);
  });
});

describe("planBoardMove", () => {
  it("appends to the destination column when dropped on a column", () => {
    const tasks = [task("a", { status: "ready", order: 0 }), task("b", { status: "doing" })];

    const plan = planBoardMove(tasks, "b", { kind: "column", status: "ready" });

    expect(plan).toEqual([entry("b", "ready", 1)]);
  });

  it("inserts before the hovered card and reindexes the destination column", () => {
    const tasks = [
      task("x", { status: "ready", order: 0 }),
      task("y", { status: "ready", order: 1 }),
      task("z", { status: "doing" })
    ];

    const plan = planBoardMove(tasks, "z", { kind: "task", taskId: "y" });

    expect(plan).toEqual([
      entry("z", "ready", 1),
      entry("y", "ready", 2)
    ]);
  });

  it("plans same-column reorders", () => {
    const tasks = [
      task("a", { status: "ready", order: 0 }),
      task("b", { status: "ready", order: 1 }),
      task("c", { status: "ready", order: 2 })
    ];

    const plan = planBoardMove(tasks, "c", { kind: "task", taskId: "a" });

    expect(plan).toEqual([
      entry("c", "ready", 0),
      entry("a", "ready", 1),
      entry("b", "ready", 2)
    ]);
  });

  it("returns no updates when nothing changes", () => {
    const tasks = [
      task("a", { status: "ready", order: 0 }),
      task("b", { status: "ready", order: 1 })
    ];

    // Dropping the first card onto the second keeps the existing sequence.
    expect(planBoardMove(tasks, "a", { kind: "task", taskId: "b" })).toEqual([]);
    // Re-appending the trailing card to its own column keeps it in place.
    expect(planBoardMove(tasks, "b", { kind: "column", status: "ready" })).toEqual([]);
  });

  it("returns no plan for unknown cards or targets", () => {
    const tasks = [task("a")];

    expect(planBoardMove(tasks, "missing", { kind: "column", status: "ready" })).toEqual([]);
    expect(planBoardMove(tasks, "a", { kind: "task", taskId: "missing" })).toEqual([]);
  });
});
