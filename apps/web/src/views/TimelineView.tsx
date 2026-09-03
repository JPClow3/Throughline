import { Course, Task, kanbanColumns } from "@throughline/domain";
import { CalendarBlank, Play, Plus } from "@phosphor-icons/react";
import React, { useMemo, useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core/dist/types/events";
import { FilterBar } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { APP_LOCALE, capitalizeFirst } from "../lib/format";
import { Button, Card, EmptyState } from "../ui";
import { usePlanner } from "../state/PlannerProvider";

function localDayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(APP_LOCALE, { hour: "numeric", minute: "2-digit" });
}

type AgendaRowProps = {
  task: Task;
  courseMap: Map<string, Course>;
  onStartFocus?: (task: Task) => void;
  isGhost?: boolean;
};

const AgendaRow = React.forwardRef<HTMLDivElement, AgendaRowProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, courseMap, onStartFocus, isGhost, className = "", ...rest }, ref) => {
    const course = courseMap.get(task.courseId ?? "");
    const start = new Date(task.dueAt as string);
    const end = new Date(start.getTime() + (task.estimatedMinutes ?? 0) * 60_000);

    return (
      <div ref={ref} className={`agenda-row ${isGhost ? "opacity-90" : ""} ${className}`} {...rest}>
        <time className="agenda-time">{formatTime(start)}</time>
        <Card
          flat
          className="agenda-card"
          style={{ "--project-color": course?.color ?? "var(--ink)" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="agenda-range">
                {formatTime(start)}
                {task.estimatedMinutes ? ` – ${formatTime(end)}` : ""}
                {course ? ` · ${course.name}` : ""}
              </span>
              <h3 className="mt-0.5">{task.title}</h3>
              <span className="agenda-status">{kanbanColumns[task.status]}</span>
            </div>
            {onStartFocus && task.status !== "done" && !isGhost ? (
              <button
                type="button"
                className="meta-chip"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartFocus(task);
                }}
                aria-label={`Start focus mode for ${task.title}`}
              >
                <Play size={12} weight="bold" />
                Focus
              </button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }
);
AgendaRow.displayName = "AgendaRow";

export function TimelineView({
  onNewTask,
  onStartFocus,
  onUpdateTask
}: {
  onNewTask?: (date?: Date) => void;
  onStartFocus?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
}) {
  const { tasks, courses, goals, tags, courseById } = usePlanner();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedKey, setSelectedKey] = useState(() => localDayKey(today));
  const { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset } = useFilters();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const days = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- today is a stable midnight anchor per mount.
  }, []);

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

    if (over && over.data.current?.type === "day") {
      const targetDateStr = over.id.toString().replace("day-", "");
      if (targetDateStr !== selectedKey) {
        const oldDate = new Date(task.dueAt as string);
        const [year, month, day] = targetDateStr.split("-").map(Number);
        const newDate = new Date(oldDate);
        newDate.setFullYear(year, month - 1, day);
        onUpdateTask?.({ ...task, dueAt: newDate.toISOString() });
      }
      return;
    }

    const dragPixelsPer30Min = 40;
    const steps = Math.round(delta.y / dragPixelsPer30Min);

    if (steps !== 0) {
      const oldDate = new Date(task.dueAt as string);
      const newDate = new Date(oldDate.getTime() + steps * 30 * 60_000);
      const minutes = newDate.getMinutes();
      const snappedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 60;
      newDate.setMinutes(snappedMinutes, 0, 0);
      onUpdateTask?.({ ...task, dueAt: newDate.toISOString() });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="view-layout">
        <header className="view-head">
          <div>
            <span className="eyebrow">Agenda</span>
            <h1 className="view-title">Timeline</h1>
          </div>
          <FilterBar
            courses={courses}
            goals={goals}
            filters={filters}
            setFilter={setFilter}
            presets={presets}
            availableTags={tags}
            onApplyPreset={applyPreset}
            onClearFilters={clearFilters}
            onSavePreset={saveCurrentPreset}
            showDateFilter={false}
            showStatusFilter
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

        <div className="view-head agenda-day-head">
          <div>
            <span className="eyebrow">Selected day</span>
            <h2 className="agenda-day-title">
              {capitalizeFirst(selectedDate.toLocaleDateString(APP_LOCALE, { weekday: "long", month: "long", day: "numeric" }))}
            </h2>
          </div>
          <Button variant="accent" onClick={() => onNewTask?.(selectedDate)}>
            <Plus size={15} weight="bold" />
            New Task for {capitalizeFirst(selectedDate.toLocaleDateString(APP_LOCALE, { weekday: "short" }))}
          </Button>
        </div>

        {dayTasks.length ? (
          <div className="agenda relative">
            {dayTasks.map((task) => (
              <DraggableAgendaRow key={task.id} task={task} courseMap={courseById} onStartFocus={onStartFocus} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarBlank size={24} weight="bold" />}
            title="Nothing scheduled"
            body="No tasks due on this day. Pick another day, or give a task a due time."
          />
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? <AgendaRow task={activeTask} courseMap={courseById} isGhost /> : null}
      </DragOverlay>
    </DndContext>
  );
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
      className={`day-chip${active ? " active" : ""}${isOver ? " is-over" : ""}`}
      onClick={onClick}
    >
      <span className="day-chip-weekday">{capitalizeFirst(date.toLocaleDateString(APP_LOCALE, { weekday: "short" }))}</span>
      <span className="day-chip-date">{date.getDate()}</span>
    </button>
  );
}

function DraggableAgendaRow({
  task,
  courseMap,
  onStartFocus
}: {
  task: Task;
  courseMap: Map<string, Course>;
  onStartFocus?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task }
  });

  return (
    <AgendaRow
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      task={task}
      courseMap={courseMap}
      onStartFocus={onStartFocus}
      className={`cursor-grab active:cursor-grabbing${isDragging ? " opacity-30" : ""}`}
    />
  );
}
