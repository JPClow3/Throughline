import { Course, Task, exportTasksToIcs } from "@throughline/domain";

export function downloadIcs(tasks: Task[], courses: Course[]) {
  const withDueDates = tasks.filter((task) => task.dueAt);
  if (withDueDates.length === 0) {
    throw new Error("No due tasks to export yet.");
  }
  const ics = exportTasksToIcs(tasks, { courses });
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "throughline.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
