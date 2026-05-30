import { Course, Task, kanbanColumns } from "@throughline/domain";
import { CalendarBlank } from "@phosphor-icons/react";
import { useState, type CSSProperties } from "react";
import { capitalizeFirst } from "../lib/format";
import { EmptyState } from "./EmptyState";

function localDayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function CalendarTimeline({ tasks, courses }: { tasks: Task[]; courses: Course[] }) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedKey, setSelectedKey] = useState(() => localDayKey(today));
  const [projectFilter, setProjectFilter] = useState("");

  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });

  const dayTasks = tasks
    .filter((task) => task.dueAt && localDayKey(new Date(task.dueAt)) === selectedKey)
    .filter((task) =>
      !projectFilter ? true : projectFilter === "__none" ? !task.courseId : task.courseId === projectFilter
    )
    .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());

  const selectedDate = new Date(`${selectedKey}T12:00:00`);

  return (
    <div>
      <header className="view-head">
        <div>
          <span className="eyebrow">Agenda</span>
          <h1>Timeline</h1>
        </div>
        {courses.length ? (
          <div className="view-toolbar">
            <select
              className="toolbar-filter"
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              aria-label="Filter by project"
            >
              <option value="">All projects</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
              <option value="__none">No project</option>
            </select>
          </div>
        ) : null}
      </header>

      <div className="day-strip" role="tablist" aria-label="Select a day">
        {days.map((date) => {
          const key = localDayKey(date);
          const active = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`day-chip${active ? " active" : ""}`}
              onClick={() => setSelectedKey(key)}
            >
              <span className="day-chip-weekday">{capitalizeFirst(date.toLocaleDateString(undefined, { weekday: "short" }))}</span>
              <span className="day-chip-date">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <h2 className="agenda-day-title">
        {capitalizeFirst(selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }))}
      </h2>

      {dayTasks.length ? (
        <div className="agenda">
          {dayTasks.map((task) => {
            const course = courseMap.get(task.courseId ?? "");
            const start = new Date(task.dueAt as string);
            const end = new Date(start.getTime() + (task.estimatedMinutes ?? 0) * 60_000);
            return (
              <div key={task.id} className="agenda-row">
                <time className="agenda-time">{formatTime(start)}</time>
                <div
                  className="agenda-card"
                  style={{ "--project-color": course?.color ?? "var(--border-strong)" } as CSSProperties}
                >
                  <span className="agenda-range">
                    {formatTime(start)}
                    {task.estimatedMinutes ? ` – ${formatTime(end)}` : ""}
                    {course ? ` · ${course.name}` : ""}
                  </span>
                  <h3>{task.title}</h3>
                  <span className="agenda-status">{kanbanColumns[task.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarBlank size={26} />}
          title="Nothing scheduled"
          body="No tasks due on this day. Pick another day, or give a task a due time."
        />
      )}
    </div>
  );
}
