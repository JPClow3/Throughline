import { Course, Task, exportTasksToIcs } from "@throughline/domain";

export function downloadIcs(tasks: Task[], courses: Course[]) {
  const ics = exportTasksToIcs(tasks, { courses });
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "liquidglass-study-quests.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}
