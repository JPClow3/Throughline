import { Course, Goal, Note, Task } from "@throughline/domain";
import { useMemo } from "react";
import type { AppView } from "../components/AppShell";

export type GlobalSearchResultType = "task" | "note" | "goal" | "project";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string;
  view: AppView;
  groupLabel: string;
  lastTouchedAt: string;
  actionLabel?: string;
};

export function buildGlobalSearchResults({
  query,
  tasks,
  notes,
  goals,
  courses
}: {
  query: string;
  tasks: Task[];
  notes: Note[];
  goals: Goal[];
  courses: Course[];
}): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return buildRecentResults({ tasks, notes, goals, courses });
  }

  const matches = (parts: Array<string | undefined>) => parts.some((part) => part?.toLowerCase().includes(q));
  const results: GlobalSearchResult[] = [];

  for (const task of tasks) {
    if (matches([task.title, task.description, ...(task.tags ?? [])])) {
      results.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: task.status === "done" ? "Completed task" : "Task",
        view: "kanban",
        groupLabel: "Tasks",
        lastTouchedAt: task.completedAt ?? task.updatedAt,
        actionLabel: "Open task"
      });
    }
  }

  for (const note of notes) {
    if (matches([note.title || "Untitled note", note.body])) {
      results.push({
        id: note.id,
        type: "note",
        title: note.title || "Untitled note",
        subtitle: "Note",
        view: "notes",
        groupLabel: "Notes",
        lastTouchedAt: note.updatedAt,
        actionLabel: "Open note"
      });
    }
  }

  for (const goal of goals) {
    if (matches([goal.title, goal.summary])) {
      results.push({
        id: goal.id,
        type: "goal",
        title: goal.title,
        subtitle: "Goal",
        view: "goals",
        groupLabel: "Goals",
        lastTouchedAt: goal.completedAt ?? goal.updatedAt,
        actionLabel: "Open goal"
      });
    }
  }

  for (const course of courses) {
    if (matches([course.name, course.code])) {
      results.push({
        id: course.id,
        type: "project",
        title: course.name,
        subtitle: course.code ? `Project · ${course.code}` : "Project",
        view: "courses",
        groupLabel: "Projects",
        lastTouchedAt: course.updatedAt,
        actionLabel: "Open project"
      });
    }
  }

  return results.slice(0, 12);
}

function buildRecentResults({
  tasks,
  notes,
  goals,
  courses
}: {
  tasks: Task[];
  notes: Note[];
  goals: Goal[];
  courses: Course[];
}): GlobalSearchResult[] {
  const results: GlobalSearchResult[] = [
    ...tasks.map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      subtitle: task.status === "done" ? "Completed task" : "Task",
      view: "kanban" as AppView,
      groupLabel: "Recent",
      lastTouchedAt: task.completedAt ?? task.updatedAt,
      actionLabel: "Open task"
    })),
    ...notes.map((note) => ({
      id: note.id,
      type: "note" as const,
      title: note.title || "Untitled note",
      subtitle: "Note",
      view: "notes" as AppView,
      groupLabel: "Recent",
      lastTouchedAt: note.updatedAt,
      actionLabel: "Open note"
    })),
    ...goals.map((goal) => ({
      id: goal.id,
      type: "goal" as const,
      title: goal.title,
      subtitle: "Goal",
      view: "goals" as AppView,
      groupLabel: "Recent",
      lastTouchedAt: goal.completedAt ?? goal.updatedAt,
      actionLabel: "Open goal"
    })),
    ...courses.map((course) => ({
      id: course.id,
      type: "project" as const,
      title: course.name,
      subtitle: course.code ? `Project · ${course.code}` : "Project",
      view: "courses" as AppView,
      groupLabel: "Recent",
      lastTouchedAt: course.updatedAt,
      actionLabel: "Open project"
    }))
  ];

  return results
    .sort((a, b) => new Date(b.lastTouchedAt).getTime() - new Date(a.lastTouchedAt).getTime())
    .slice(0, 8);
}

export function useGlobalSearch(input: {
  query: string;
  tasks: Task[];
  notes: Note[];
  goals: Goal[];
  courses: Course[];
}) {
  const { query, tasks, notes, goals, courses } = input;
  return useMemo(
    () => buildGlobalSearchResults({ query, tasks, notes, goals, courses }),
    [query, tasks, notes, goals, courses]
  );
}
