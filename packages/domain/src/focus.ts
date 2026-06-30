import { Course, FocusSession, FocusSessionSchema, Task } from "./types";
import { createId } from "./factories";

type FocusSessionDraft = {
  id?: string;
  title?: string;
  taskId?: string;
  courseId?: string;
  goalId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  createdAt?: string;
};

export type ActivityDay = {
  date: string;
  count: number;
  focusMinutes: number;
};

export type NextStudyBlock = {
  task: Task;
  startsAt: string;
  minutes: number;
};

export type TodayStats = {
  focusMinutesToday: number;
  plannedStudyMinutesToday: number;
  completedTasksToday: number;
  todayTaskTotal: number;
  overdueCount: number;
  dueTodayCount: number;
  nextStudyBlock?: NextStudyBlock;
  completedByDay: ActivityDay[];
};

export type TodayGuidanceKind = "start" | "due" | "focus" | "overdue" | "blocked";

export type TodayGuidance = {
  id: string;
  kind: TodayGuidanceKind;
  message: string;
};

export type TodayBriefing = {
  progressSentence: string;
  priorityTasks: Task[];
  guidance: TodayGuidance[];
  overdueCount: number;
  blockedCount: number;
  clearBlockMinutes: number;
  dueBefore?: string;
  nextTask?: Task;
  stats: TodayStats;
};

export type CoachingInsight = {
  id: string;
  message: string;
  detail: string;
  tone: "focus" | "balance" | "cleanup";
};

export function createFocusSession(input: FocusSessionDraft = {}): FocusSession {
  const now = new Date().toISOString();
  const startedAt = input.startedAt ?? now;
  const endedAt = input.endedAt;
  const durationMinutes =
    input.durationMinutes ??
    (endedAt ? Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000)) : 25);

  return FocusSessionSchema.parse({
    id: input.id ?? createId("focus"),
    title: input.title ?? "Focus Session",
    taskId: input.taskId,
    courseId: input.courseId,
    goalId: input.goalId,
    startedAt,
    endedAt,
    durationMinutes,
    createdAt: input.createdAt ?? now,
    updatedAt: now
  });
}

export function isLegacyFocusTask(task: Pick<Task, "title" | "tags" | "status">) {
  return task.status === "done" && task.title === "Focus Session" && (task.tags ?? []).includes("focus");
}

export function deriveTodayStats({
  tasks,
  focusSessions,
  now = new Date(),
  days = 84
}: {
  tasks: Task[];
  focusSessions: FocusSession[];
  now?: Date;
  days?: number;
}): TodayStats {
  const today = localDayKey(now);
  const todayTaskIds = new Set<string>();
  let completedTasksToday = 0;
  let plannedStudyMinutesToday = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;

  const completedByDay = buildActivityDays(now, days);
  const dayMap = new Map(completedByDay.map((day) => [day.date, day]));

  for (const task of tasks) {
    const legacyFocus = isLegacyFocusTask(task);
    const completedDay = task.completedAt ? localDayKey(new Date(task.completedAt)) : "";
    const dueDay = task.dueAt ? localDayKey(new Date(task.dueAt)) : "";

    if (task.dueAt && dueDay === today && task.status !== "done" && !legacyFocus) {
      plannedStudyMinutesToday += task.estimatedMinutes ?? 0;
      dueTodayCount += 1;
    }

    if (task.dueAt && dueDay < today && task.status !== "done" && !legacyFocus) {
      overdueCount += 1;
    }

    if (!legacyFocus && (completedDay === today || dueDay === today)) {
      todayTaskIds.add(task.id);
    }

    if (!legacyFocus && task.status === "done" && completedDay === today) {
      completedTasksToday += 1;
    }

    const activity = dayMap.get(completedDay);
    if (activity) {
      if (legacyFocus) {
        activity.focusMinutes += task.estimatedMinutes ?? 0;
      } else if (task.status === "done") {
        activity.count += 1;
      }
    }
  }

  for (const session of focusSessions) {
    const activity = dayMap.get(localDayKey(new Date(session.startedAt)));
    if (activity) {
      activity.focusMinutes += session.durationMinutes;
    }
  }

  const focusMinutesToday = dayMap.get(today)?.focusMinutes ?? 0;
  const nextStudyBlockTask = tasks
    .filter((task) => task.status !== "done" && !isLegacyFocusTask(task) && task.dueAt && new Date(task.dueAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime())[0];

  return {
    focusMinutesToday,
    plannedStudyMinutesToday,
    completedTasksToday,
    todayTaskTotal: todayTaskIds.size,
    overdueCount,
    dueTodayCount,
    nextStudyBlock: nextStudyBlockTask
      ? {
          task: nextStudyBlockTask,
          startsAt: nextStudyBlockTask.dueAt as string,
          minutes: nextStudyBlockTask.estimatedMinutes ?? 0
        }
      : undefined,
    completedByDay
  };
}

export function deriveTodayBriefing({
  tasks,
  focusSessions,
  now = new Date()
}: {
  tasks: Task[];
  focusSessions: FocusSession[];
  now?: Date;
}): TodayBriefing {
  const stats = deriveTodayStats({ tasks, focusSessions, now });
  const activeTasks = tasks.filter((task) => task.status !== "done" && !isLegacyFocusTask(task));
  const priorityTasks = [...activeTasks].sort((a, b) => compareTodayPriority(a, b, now)).slice(0, 5);
  const blockedCount = activeTasks.filter((task) => task.status === "blocked").length;
  const nextTask = priorityTasks.find((task) => task.status !== "blocked") ?? priorityTasks[0];
  const dueBefore = dueBeforeTime(activeTasks, now);
  const clearBlockMinutes = clearMinutesUntilNextDue(activeTasks, now);
  const guidance: TodayGuidance[] = [];

  if (nextTask) {
    guidance.push({
      id: "start",
      kind: "start",
      message: `Start with ${nextTask.title}`
    });
  }

  if (dueBefore) {
    const dueBeforeCount = countDueBefore(activeTasks, now, dueBefore);
    guidance.push({
      id: "due-before",
      kind: "due",
      message: `${dueBeforeCount} ${dueBeforeCount === 1 ? "task is" : "tasks are"} due before ${dueBefore}`
    });
  }

  if (clearBlockMinutes >= 45) {
    guidance.push({
      id: "clear-block",
      kind: "focus",
      message: `You have a ${formatBriefMinutes(clearBlockMinutes)} clear block`
    });
  }

  if (stats.overdueCount > 0) {
    guidance.push({
      id: "overdue",
      kind: "overdue",
      message: `${stats.overdueCount} ${stats.overdueCount === 1 ? "task is" : "tasks are"} overdue`
    });
  }

  if (blockedCount > 0) {
    guidance.push({
      id: "blocked",
      kind: "blocked",
      message: `${blockedCount === 1 ? "One task is" : `${blockedCount} tasks are`} blocked`
    });
  }

  return {
    progressSentence: progressSentence(stats),
    priorityTasks,
    guidance,
    overdueCount: stats.overdueCount,
    blockedCount,
    clearBlockMinutes,
    dueBefore,
    nextTask,
    stats
  };
}

export function deriveCoachingInsights({
  tasks,
  courses,
  focusSessions,
  now = new Date()
}: {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  now?: Date;
}): CoachingInsight[] {
  const insights: CoachingInsight[] = [];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const effortByCourse = new Map<string, number>();
  let morningCompletions = 0;
  let laterCompletions = 0;
  let totalEffort = 0;

  for (const task of tasks) {
    if (task.completedAt) {
      const completedAt = new Date(task.completedAt);
      if (completedAt >= sevenDaysAgo && !isLegacyFocusTask(task)) {
        const effort = task.estimatedMinutes ?? 0;
        totalEffort += effort;
        if (task.courseId) {
          effortByCourse.set(task.courseId, (effortByCourse.get(task.courseId) ?? 0) + effort);
        }
        if (completedAt.getHours() < 12) {
          morningCompletions += 1;
        } else {
          laterCompletions += 1;
        }
      }
    }
  }

  for (const session of focusSessions) {
    const startedAt = new Date(session.startedAt);
    if (startedAt >= sevenDaysAgo && session.courseId) {
      totalEffort += session.durationMinutes;
      effortByCourse.set(session.courseId, (effortByCourse.get(session.courseId) ?? 0) + session.durationMinutes);
    }
  }

  const topCourse = [...effortByCourse.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCourse && totalEffort > 0 && topCourse[1] / totalEffort >= 0.6) {
    const course = courseMap.get(topCourse[0]);
    if (course) {
      insights.push({
        id: "course-load",
        message: `${course.name} is carrying most of this week.`,
        detail: "Consider whether one other project needs a small scheduled block.",
        tone: "balance"
      });
    }
  }

  if (morningCompletions >= 2 && morningCompletions > laterCompletions) {
    insights.push({
      id: "morning-completions",
      message: "You complete more tasks before noon.",
      detail: "Put one demanding task early when your schedule allows it.",
      tone: "focus"
    });
  }

  const today = localDayKey(now);
  const overdueNoProject = tasks.filter(
    (task) =>
      task.status !== "done" &&
      !task.courseId &&
      task.dueAt &&
      localDayKey(new Date(task.dueAt)) < today
  ).length;
  if (overdueNoProject >= 3) {
    insights.push({
      id: "overdue-no-project",
      message: `${numberWord(overdueNoProject)} overdue tasks have no project.`,
      detail: "Grouping them can make the backlog easier to clear.",
      tone: "cleanup"
    });
  }

  return insights.slice(0, 4);
}

export function localDayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildActivityDays(now: Date, days: number): ActivityDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    return { date: localDayKey(date), count: 0, focusMinutes: 0 };
  });
}

function progressSentence(stats: TodayStats) {
  if (stats.todayTaskTotal === 0 && stats.overdueCount === 0) {
    return "A clear day. Capture one thing if it matters.";
  }

  if (stats.todayTaskTotal > 0 && stats.completedTasksToday >= stats.todayTaskTotal) {
    return "Today's planned tasks are complete.";
  }

  if (stats.todayTaskTotal > 0) {
    return `${stats.completedTasksToday} of ${stats.todayTaskTotal} ${stats.todayTaskTotal === 1 ? "task" : "tasks"} done. Keep it quiet and steady.`;
  }

  return `${stats.overdueCount} overdue ${stats.overdueCount === 1 ? "task needs" : "tasks need"} a decision.`;
}

function compareTodayPriority(a: Task, b: Task, now: Date) {
  const scoreDiff = priorityScore(b, now) - priorityScore(a, now);
  if (scoreDiff !== 0) return scoreDiff;

  const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;

  return a.order - b.order;
}

function priorityScore(task: Task, now: Date) {
  const today = localDayKey(now);
  const dueDay = task.dueAt ? localDayKey(new Date(task.dueAt)) : "";
  let score = 0;

  if (task.dueAt && dueDay < today) score += 10_000;
  if (task.dueAt && dueDay === today) score += 8_000;
  if (task.status === "doing") score += 5_000;
  if (task.priority === "critical") score += 4_000;
  if (task.priority === "high") score += 3_000;
  if (task.status === "blocked") score += 1_500;
  if (task.dueAt && dueDay > today) score += 600;
  score += Math.max(0, 6 - task.difficulty) * 20;

  return score;
}

function dueBeforeTime(tasks: Task[], now: Date) {
  const today = localDayKey(now);
  const dueToday = tasks
    .filter((task) => task.dueAt && localDayKey(new Date(task.dueAt)) === today)
    .map((task) => new Date(task.dueAt as string))
    .sort((a, b) => a.getTime() - b.getTime());

  const firstEveningDue = dueToday.find((date) => date.getHours() <= 18);
  if (!firstEveningDue) return undefined;
  return `${String(firstEveningDue.getHours()).padStart(2, "0")}:${String(firstEveningDue.getMinutes()).padStart(2, "0")}`;
}

function countDueBefore(tasks: Task[], now: Date, timeLabel: string) {
  const today = localDayKey(now);
  const [hour, minute] = timeLabel.split(":").map(Number);
  const cutoff = new Date(now);
  cutoff.setHours(hour, minute, 59, 999);
  return tasks.filter((task) => task.dueAt && localDayKey(new Date(task.dueAt)) === today && new Date(task.dueAt) <= cutoff).length;
}

function clearMinutesUntilNextDue(tasks: Task[], now: Date) {
  const nextDue = tasks
    .filter((task) => task.dueAt && new Date(task.dueAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime())[0];

  if (!nextDue?.dueAt) return 0;
  return Math.max(0, Math.floor((new Date(nextDue.dueAt).getTime() - now.getTime()) / 60_000));
}

function formatBriefMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}-minute`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}-hour`;
}

function numberWord(value: number) {
  const words: Record<number, string> = {
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five"
  };
  return words[value] ?? String(value);
}
