import { Course, Task } from "./types";

type IcsExportOptions = {
  calendarName?: string;
  courses?: Course[];
};

export function exportTasksToIcs(tasks: Task[], options: IcsExportOptions = {}) {
  const calendarName = options.calendarName ?? "Throughline";
  const courseById = new Map(options.courses?.map((course) => [course.id, course]));
  const now = formatIcsDateTime(new Date().toISOString());
  const events = tasks
    .filter((task) => Boolean(task.dueAt))
    .map((task) => taskToEvent(task, now, courseById.get(task.courseId ?? "")));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Throughline//Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ...events,
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

function taskToEvent(task: Task, timestamp: string, course?: Course) {
  const start = formatIcsDateTime(task.dueAt as string);
  const summary = course ? `${course.code ?? course.name}: ${task.title}` : task.title;
  const description = [
    task.description,
    `Status: ${task.status}`,
    `XP: ${task.xp}`,
    task.tags.length ? `Tags: ${task.tags.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(task.id)}@throughline.local`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${start}`,
    `DUE:${start}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `CATEGORIES:${escapeIcsText(task.tags.join(","))}`,
    "END:VEVENT"
  ].join("\r\n");
}

export function formatIcsDateTime(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
