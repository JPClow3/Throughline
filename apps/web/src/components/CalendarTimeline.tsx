import { Course, Goal, Task, kanbanColumns } from "@throughline/domain";
import { CalendarBlank, Plus, Play } from "@phosphor-icons/react";
import { useState, useMemo, type CSSProperties } from "react";
import { FilterBar } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { APP_LOCALE, capitalizeFirst } from "../lib/format";
import { EmptyState } from "./EmptyState";

function localDayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(APP_LOCALE, { hour: "numeric", minute: "2-digit" });
}

export function CalendarTimeline({ tasks, courses, goals = [], onNewTask, onStartFocus }: { tasks: Task[]; courses: Course[]; goals?: Goal[]; onNewTask?: (date?: Date) => void; onStartFocus?: (task: Task) => void }) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedKey, setSelectedKey] = useState(() => localDayKey(today));
  const { filters, setFilter, applyFilters } = useFilters();

  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });

  const dayTasks = useMemo(() => {
    return applyFilters(tasks, true, false)
      .filter((task) => task.dueAt && localDayKey(new Date(task.dueAt)) === selectedKey)
      .sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());
  }, [tasks, applyFilters, selectedKey]);

  const selectedDate = new Date(`${selectedKey}T12:00:00`);

  return (
    <div>
      <header className="view-head">
        <div>
          <span className="eyebrow">Agenda</span>
          <h1>Timeline</h1>
        </div>
        <FilterBar courses={courses} goals={goals} filters={filters} setFilter={setFilter} showDateFilter={false} showStatusFilter={true} />
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
              <span className="day-chip-weekday">{capitalizeFirst(date.toLocaleDateString(APP_LOCALE, { weekday: "short" }))}</span>
              <span className="day-chip-date">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          {capitalizeFirst(selectedDate.toLocaleDateString(APP_LOCALE, { weekday: "long", month: "long", day: "numeric" }))}
        </h2>
        <button 
          onClick={() => onNewTask?.(selectedDate)}
          className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:scale-[1.015] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus size={16} weight="bold" />
          New Task for Today
        </button>
      </div>

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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3>{task.title}</h3>
                      <span className="agenda-status">{kanbanColumns[task.status]}</span>
                    </div>
                    {onStartFocus && task.status !== "done" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
                        className="meta-chip meta-chip-button hover:bg-surface-container-highest transition-colors cursor-pointer"
                        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                        aria-label={`Start focus mode for ${task.title}`}
                      >
                        <Play size={14} />
                        Focus
                      </button>
                    ) : null}
                  </div>
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
