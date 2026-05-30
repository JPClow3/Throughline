import { Task } from "./types";

export type GoalProgress = {
  total: number;
  completed: number;
  remaining: number;
  ratio: number;
  isComplete: boolean;
};

/** Child tasks of a goal, ordered by their explicit order then creation time. */
export function tasksForGoal(goalId: string, tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.goalId === goalId)
    .sort((a, b) => a.order - b.order || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Roll-up progress for a goal, derived from its child tasks. */
export function deriveGoalProgress(goalId: string, tasks: Task[]): GoalProgress {
  const owned = tasks.filter((task) => task.goalId === goalId);
  const total = owned.length;
  const completed = owned.filter((task) => task.status === "done").length;

  return {
    total,
    completed,
    remaining: total - completed,
    ratio: total ? Math.round((completed / total) * 100) : 0,
    isComplete: total > 0 && completed === total
  };
}

/** Next sort order to place a new task at the end of a goal's task list. */
export function nextGoalTaskOrder(goalId: string, tasks: Task[]): number {
  const owned = tasks.filter((task) => task.goalId === goalId);
  if (owned.length === 0) {
    return 0;
  }
  return Math.max(...owned.map((task) => task.order)) + 1;
}
