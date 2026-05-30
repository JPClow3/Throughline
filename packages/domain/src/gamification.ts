import { RpgAttribute, rpgAttributes, Task, UserProgress } from "./types";

const priorityBonus = {
  low: 0,
  medium: 8,
  high: 18,
  critical: 32
} as const;

export function calculateTaskXp(task: Pick<Task, "difficulty" | "energy" | "priority" | "estimatedMinutes">) {
  const effort = task.difficulty * 14 + task.energy * 8;
  const duration = Math.min(60, Math.round(task.estimatedMinutes / 5));

  return Math.max(10, effort + duration + priorityBonus[task.priority]);
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 120)) + 1);
}

export function deriveUserProgress(tasks: Task[]): UserProgress {
  const completed = tasks.filter((task) => task.status === "done");
  const xp = completed.reduce((sum, task) => sum + task.xp, 0);
  const attributes = Object.fromEntries(rpgAttributes.map((attribute) => [attribute, 0])) as Record<
    RpgAttribute,
    number
  >;

  for (const task of completed) {
    for (const attribute of task.attributes) {
      attributes[attribute] += Math.max(1, Math.ceil(task.xp / 30));
    }
  }

  const streakDays = calculateCompletionStreak(completed);
  const badges = [
    completed.length >= 1 ? "First Quest" : "",
    completed.length >= 5 ? "Study Combo" : "",
    streakDays >= 3 ? "Three-Day Focus" : "",
    xp >= 600 ? "Semester Hero" : ""
  ].filter(Boolean);

  return {
    id: "local-player",
    level: levelFromXp(xp),
    xp,
    streakDays,
    attributes,
    badges
  };
}

export function calculateCompletionStreak(tasks: Pick<Task, "completedAt">[]) {
  const completedDays = new Set(
    tasks
      .map((task) => task.completedAt)
      .filter(Boolean)
      .map((date) => new Date(date as string).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (completedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
