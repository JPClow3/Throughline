import { Course, Goal, Task, kanbanColumns } from "@throughline/domain";
import { CalendarBlank, Plus, Play } from "@phosphor-icons/react";
import React, { useState, useMemo, type CSSProperties } from "react";
import { FilterBar } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { APP_LOCALE, capitalizeFirst } from "../lib/format";
import { EmptyState } from "./EmptyState";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
  closestCorners
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core/dist/types/events";

function localDayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(APP_LOCALE, { hour: "numeric", minute: "2-digit" });
}

function DayChip({ date, active, onClick }: { date: Date; active: boolean; onClick: () => void }) {
  const key = localDayKey(date);
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${key}`,
    data: { type: "day", date }
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      role="tab"
      aria-selected={active}
      className={`day-chip ${active ? "active" : ""} ${isOver ? "ring-2 ring-primary ring-inset" : ""}`}
      onClick={onClick}
    >
      <span className="day-chip-weekday">{capitalizeFirst(date.toLocaleDateString(APP_LOCALE, { weekday: "short" }))}</span>
      <span className="day-chip-date">{date.getDate()}</span>
    </button>
  );
}

type AgendaRowRenderProps = {
  task: Task;
  courseMap: Map<string, Course>;
  onStartFocus?: (task: Task) => void;
  isGhost?: boolean;
};

const AgendaRowRender = React.forwardRef<HTMLDivElement, AgendaRowRenderProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, courseMap, onStartFocus, isGhost, style, className = "", ...props }, ref) => {
    const course = courseMap.get(task.courseId ?? "");
    const start = new Date(task.dueAt as string);
    const end = new Date(start.getTime() + (task.estimatedMinutes ?? 0) * 60_000);

    return (
      <div
        ref={ref}
        style={style}
        className={`agenda-row ${isGhost ? "opacity-90 shadow-2xl scale-[1.02] rotate-1 cursor-grabbing z-50 bg-surface" : ""} ${className}`}
        {...props}
      >
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
            {onStartFocus && task.status !== "done" && !isGhost ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(task);
                }}
                className="meta-chip meta-chip-button hover:bg-[var(--accent-soft)] interactive-scale cursor-pointer"
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
  }
);

function DraggableAgendaRow({ task, courseMap, onStartFocus }: { task: Task; courseMap: Map<string, Course>; onStartFocus?: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task }
  });

  return (
    <AgendaRowRender
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      task={task}
      courseMap={courseMap}
      onStartFocus={onStartFocus}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    />
  );
}

export function CalendarTimeline({
  tasks,
  courses,
  goals = [],
  onNewTask,
  onStartFocus,
  onUpdateTask
}: {
  tasks: Task[];
  courses: Course[];
  goals?: Goal[];
  onNewTask?: (date?: Date) => void;
  onStartFocus?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
}) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedKey, setSelectedKey] = useState(() => localDayKey(today));
  const { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset } = useFilters();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const availableTags = useMemo(
    () => Array.from(new Set(tasks.flatMap((task) => task.tags ?? []))).sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // drag 5px to activate
      }
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over, delta } = event;
    const task = active.data.current?.task as Task;
    if (!task) return;

    // Check if dropped on a day chip
    if (over && over.data.current?.type === "day") {
      const targetDateStr = over.id.toString().replace("day-", "");
      if (targetDateStr !== selectedKey) {
        // Change the day, keep the time
        const oldDate = new Date(task.dueAt as string);
        const [y, m, d] = targetDateStr.split("-").map(Number);
        const newDate = new Date(oldDate);
        newDate.setFullYear(y, m - 1, d);
        onUpdateTask?.({ ...task, dueAt: newDate.toISOString() });
      }
      return;
    }

    // Otherwise, it was dropped vertically within the day (adjust time)
    // Map vertical pixel delta to 30-minute intervals
    const dragPixelsPer30Min = 40; // 40px drag = 30 mins
    const steps = Math.round(delta.y / dragPixelsPer30Min);

    if (steps !== 0) {
      const oldDate = new Date(task.dueAt as string);
      // Ensure the time wraps correctly by just adding milliseconds
      const newTime = oldDate.getTime() + steps * 30 * 60000;
      const newDate = new Date(newTime);

      // We snap to nearest 30 min just to be clean
      const minutes = newDate.getMinutes();
      const snappedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 60;
      newDate.setMinutes(snappedMinutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

      onUpdateTask?.({ ...task, dueAt: newDate.toISOString() });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div>
        <header className="view-head">
          <div>
            <span className="eyebrow">Agenda</span>
            <h1>Timeline</h1>
          </div>
          <FilterBar
            courses={courses}
            goals={goals}
            filters={filters}
            setFilter={setFilter}
            presets={presets}
            availableTags={availableTags}
            onApplyPreset={applyPreset}
            onClearFilters={clearFilters}
            onSavePreset={saveCurrentPreset}
            showDateFilter={false}
            showStatusFilter={true}
          />
        </header>

        <div className="day-strip" role="tablist" aria-label="Select a day">
          {days.map((date) => (
            <DayChip
              key={localDayKey(date)}
              date={date}
              active={localDayKey(date) === selectedKey}
              onClick={() => setSelectedKey(localDayKey(date))}
            />
          ))}
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {capitalizeFirst(selectedDate.toLocaleDateString(APP_LOCALE, { weekday: "long", month: "long", day: "numeric" }))}
          </h2>
          <button
            onClick={() => onNewTask?.(selectedDate)}
            className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg interactive-scale flex items-center gap-2"
          >
            <Plus size={16} weight="bold" />
            New Task for Today
          </button>
        </div>

        {dayTasks.length ? (
          <div className="agenda relative">
            {dayTasks.map((task) => (
              <DraggableAgendaRow key={task.id} task={task} courseMap={courseMap} onStartFocus={onStartFocus} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarBlank size={26} />}
            title="Nothing scheduled"
            body="No tasks due on this day. Pick another day, or give a task a due time."
          />
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? <AgendaRowRender task={activeTask} courseMap={courseMap} isGhost /> : null}
      </DragOverlay>
    </DndContext>
  );
}
