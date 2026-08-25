import { Task, TaskStatus } from "@throughline/domain";

export type BoardMoveTarget =
  | { kind: "column"; status: TaskStatus }
  | { kind: "task"; taskId: string };

export type BoardMoveEntry = {
  taskId: string;
  status: TaskStatus;
  order: number;
};

/** Column display order: explicit task order first, most recently touched as the tie-break. */
export function compareBoardTasks(a: Task, b: Task): number {
  return a.order - b.order || b.updatedAt.localeCompare(a.updatedAt);
}

/**
 * Plans the minimal record updates for a board move. The destination column
 * keeps its visual sequence; every card whose status or slot changed is
 * re-emitted so custom ordering persists across sessions and devices.
 */
export function planBoardMove(tasks: Task[], activeTaskId: string, target: BoardMoveTarget): BoardMoveEntry[] {
  const active = tasks.find((task) => task.id === activeTaskId);
  if (!active) {
    return [];
  }

  const destStatus =
    target.kind === "column" ? target.status : tasks.find((task) => task.id === target.taskId)?.status;
  if (!destStatus) {
    return [];
  }

  const ids = tasks
    .filter((task) => task.status === destStatus && task.id !== activeTaskId)
    .sort(compareBoardTasks)
    .map((task) => task.id);

  const insertAt = target.kind === "task" ? Math.max(0, ids.indexOf(target.taskId)) : ids.length;
  ids.splice(insertAt, 0, active.id);

  const originalById = new Map(tasks.map((task) => [task.id, task]));
  const entries: BoardMoveEntry[] = [];
  ids.forEach((taskId, index) => {
    const task = originalById.get(taskId);
    if (!task) {
      return;
    }
    const status = taskId === active.id ? destStatus : task.status;
    if (task.status !== status || task.order !== index) {
      entries.push({ taskId, status, order: index });
    }
  });
  return entries;
}
