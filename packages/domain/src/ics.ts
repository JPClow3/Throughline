import { Course, Task } from "./types";

type IcsExportOptions = {
  calendarName?: string;
  courses?: Course[];
};

export function exportTasksToIcs(tasks: Task[], options: IcsExportOptions = {}) {
  const calendarName = options.calendarName ?? "Throughline";
  const courseById = new Map(options.courses?.map((course) => [course.id, course]));
  const now = formatIcsDateTime(new Date().toISOString());
  const events: string[] = [];
  for (const task of tasks) {
    if (!task.dueAt) continue;
    try {
      events.push(taskToEvent(task, now, courseById.get(task.courseId ?? "")));
    } catch {
      // One corrupt task must not fail the whole calendar export.
      continue;
    }
  }

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

function foldIcsLine(line: string): string {
  // RFC 5545: content lines SHOULD be folded at 75 octets. Fold conservatively
  // by UTF-16 code units — safe for the ASCII-heavy planner content here.
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
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
    foldIcsLine(`UID:${escapeIcsText(task.id)}@throughline.local`),
    `DTSTAMP:${timestamp}`,
    `DTSTART:${start}`,
    `DTEND:${start}`,
    foldIcsLine(`DUE:${start}`),
    foldIcsLine(`SUMMARY:${escapeIcsText(summary)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(description)}`),
    foldIcsLine(`CATEGORIES:${escapeIcsText(task.tags.join(","))}`),
    "END:VEVENT"
  ].join("\r\n");
}

export function formatIcsDateTime(value: string) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) throw new RangeError(`Invalid ICS datetime: ${value}`);
  return new Date(time).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/"/g, "'");
}
