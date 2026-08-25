import { Course, Task, TaskStatus, kanbanColumns, taskStatuses } from "@throughline/domain";
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical as GripVertical } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { FilterBar } from "./FilterBar";
import { useCompactFilters } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { compareBoardTasks, planBoardMove } from "../lib/board";
import { usePlanner } from "../state/PlannerProvider";
import { TaskCard } from "./TaskCard";

/** Per-status accent used by the column header dot. */
const STATUS_ACCENT: Record<TaskStatus, string> = {
  backlog: "var(--ink-faint)",
  ready: "var(--yellow)",
  doing: "var(--blue)",
  blocked: "var(--violet)",
  done: "var(--green)"
};

export function BoardView({
  onComplete,
  onStatusChange,
  onUpdateTasks,
  onEdit,
  onOpenNotes,
  onStartFocus
}: {
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Persists board moves in one batch; when absent the board falls back to status-only moves. */
  onUpdateTasks?: (updates: Task[]) => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
}) {
  const { tasks, courses, goals, courseById, noteCountByTask, tags } = usePlanner();
  const { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset } = useFilters();
  const [announcement, setAnnouncement] = useState("");
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("backlog");
  const isMobileBoard = useCompactFilters("(max-width: 1100px)");
  const filteredTasks = applyFilters(tasks, false, false).sort(compareBoardTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function commitPlan(entries: ReturnType<typeof planBoardMove>, movedTask: Task) {
    if (!entries.length) {
      return;
    }
    if (onUpdateTasks) {
      onUpdateTasks(
        entries.map((entry) => {
          const base = tasks.find((task) => task.id === entry.taskId);
          return { ...(base ?? movedTask), status: entry.status, order: entry.order };
        })
      );
      return;
    }
    const moved = entries.find((entry) => entry.taskId === movedTask.id);
    if (moved && moved.status !== movedTask.status) {
      onStatusChange(movedTask.id, moved.status);
    }
  }

  /** Status-only move (keyboard, footer select): lands at the end of the destination column. */
  function moveTo(taskId: string, nextStatus: TaskStatus) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === nextStatus) {
      return;
    }
    const entries = planBoardMove(tasks, taskId, { kind: "column", status: nextStatus });
    commitPlan(entries, task);
    setAnnouncement(`Moved ${task.title} to ${kanbanColumns[nextStatus]}.`);
  }

  function handleDragEnd(event: { active: { id: string | number }; over: { id: string | number } | null }) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const task = tasks.find((item) => item.id === activeId);
    if (!task) {
      return;
    }

    const overId = String(over.id);
    const target = taskStatuses.includes(overId as TaskStatus)
      ? { kind: "column" as const, status: overId as TaskStatus }
      : { kind: "task" as const, taskId: overId };
    const entries = planBoardMove(tasks, activeId, target);
    if (!entries.length) {
      return;
    }
    commitPlan(entries, task);

    const destStatus = entries.find((entry) => entry.taskId === activeId)?.status ?? task.status;
    setAnnouncement(
      destStatus !== task.status
        ? `Moved ${task.title} to ${kanbanColumns[destStatus]}.`
        : `Moved ${task.title} within ${kanbanColumns[destStatus]}.`
    );
  }

  return (
    <div className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">Workflow</span>
          <h1 className="view-title">Board</h1>
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
          showDateFilter
          showStatusFilter={false}
        />
      </header>
      <div className="sr-only" aria-live="polite">{announcement}</div>

      {isMobileBoard ? (
        <section className="kanban-mobile" aria-label="Kanban board">
          <div className="kanban-mobile-tabs" role="tablist" aria-label="Choose workflow status">
            {taskStatuses.map((status) => {
              const count = filteredTasks.filter((task) => task.status === status).length;
              const active = mobileStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMobileStatus(status)}
                >
                  <span>{kanbanColumns[status]}</span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
          <div className="kanban-mobile-list" role="tabpanel" aria-label={`${kanbanColumns[mobileStatus]} tasks`}>
            <header>
              <h2>{kanbanColumns[mobileStatus]}</h2>
              <span className="today-count">{filteredTasks.filter((task) => task.status === mobileStatus).length}</span>
            </header>
            <div className="kanban-stack" role="list">
              {filteredTasks.filter((task) => task.status === mobileStatus).map((task) => (
                <div key={task.id} role="listitem">
                  <TaskCard
                    task={task}
                    course={courseById.get(task.courseId ?? "")}
                    compact
                    noteCount={noteCountByTask.get(task.id) ?? 0}
                    onComplete={(target) => {
                      onComplete(target);
                      setAnnouncement(`Moved ${task.title} to Done.`);
                    }}
                    onStatusChange={(taskId, status) => {
                      const target = tasks.find((item) => item.id === taskId) ?? task;
                      moveTo(target.id, status);
                    }}
                    onEdit={onEdit}
                    onOpenNotes={onOpenNotes}
                    onStartFocus={onStartFocus}
                  />
                </div>
              ))}
              {filteredTasks.filter((task) => task.status === mobileStatus).length === 0 ? (
                <p className="kanban-empty-state">No tasks in {kanbanColumns[mobileStatus].toLowerCase()}.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <section className="kanban-board" aria-label="Kanban board">
            {taskStatuses.map((status) => {
              const columnTasks = filteredTasks.filter((task) => task.status === status);
              return (
                <KanbanColumn key={status} status={status} count={columnTasks.length}>
                  <SortableContext items={columnTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {columnTasks.map((task) => (
                      <SortableQuest
                        key={task.id}
                        task={task}
                        course={courseById.get(task.courseId ?? "")}
                        noteCount={noteCountByTask.get(task.id) ?? 0}
                        onComplete={onComplete}
                        onStatusChange={(taskId, nextStatus) => {
                          const target = tasks.find((item) => item.id === taskId) ?? task;
                          moveTo(target.id, nextStatus);
                        }}
                        onEdit={onEdit}
                        onOpenNotes={onOpenNotes}
                        onStartFocus={onStartFocus}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 ? (
                    <p className="kanban-empty-state">Nothing here.</p>
                  ) : null}
                </KanbanColumn>
              );
            })}
          </section>
        </DndContext>
      )}
    </div>
  );
}

function KanbanColumn({ status, count, children }: { status: TaskStatus; count: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column${isOver ? " is-over" : ""}`}
      style={{ "--col-accent": STATUS_ACCENT[status] } as React.CSSProperties}
      aria-label={`${kanbanColumns[status]} column with ${count} tasks`}
    >
      <header>
        <h2 className="inline-flex items-center gap-2">
          <span className="col-dot" aria-hidden="true" />
          {kanbanColumns[status]}
        </h2>
        <span className="col-count">{count}</span>
      </header>
      <div className="kanban-stack" role="list" aria-label={`${kanbanColumns[status]} tasks`}>
        {children}
      </div>
    </div>
  );
}

function SortableQuest({
  task,
  course,
  noteCount,
  onComplete,
  onStatusChange,
  onEdit,
  onOpenNotes,
  onStartFocus
}: {
  task: Task;
  course?: Course;
  noteCount?: number;
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    resizeObserverConfig: {}
  });

  return (
    <div
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "sortable-quest dragging" : "sortable-quest"}
      role="listitem"
      aria-label={`${task.title}, ${kanbanColumns[task.status]}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === "Enter") {
          event.preventDefault();
          onEdit(task);
          return;
        }
        if (event.key === " ") {
          event.preventDefault();
          onComplete(task);
          return;
        }
        if (event.ctrlKey) {
          if (event.key === "ArrowLeft") {
            const currentIndex = taskStatuses.indexOf(task.status);
            if (currentIndex > 0) {
              event.preventDefault();
              const nextStatus = taskStatuses[currentIndex - 1];
              onStatusChange(task.id, nextStatus);
              setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 0);
            }
          } else if (event.key === "ArrowRight") {
            const currentIndex = taskStatuses.indexOf(task.status);
            if (currentIndex < taskStatuses.length - 1) {
              event.preventDefault();
              const nextStatus = taskStatuses[currentIndex + 1];
              onStatusChange(task.id, nextStatus);
              setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 0);
            }
          }
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const parent = event.currentTarget.parentElement;
          if (!parent) return;
          const siblings = Array.from(parent.querySelectorAll<HTMLElement>(".sortable-quest"));
          const index = siblings.indexOf(event.currentTarget);
          if (event.key === "ArrowDown" && index < siblings.length - 1) {
            siblings[index + 1].focus();
          } else if (event.key === "ArrowUp" && index > 0) {
            siblings[index - 1].focus();
          }
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const currentColumn = event.currentTarget.closest(".kanban-column");
          if (!currentColumn) return;
          const columns = Array.from(document.querySelectorAll<HTMLElement>(".kanban-column"));
          let targetColIndex = columns.indexOf(currentColumn as HTMLElement) + (event.key === "ArrowLeft" ? -1 : 1);

          while (targetColIndex >= 0 && targetColIndex < columns.length) {
            const firstCard = columns[targetColIndex].querySelector<HTMLElement>(".sortable-quest");
            if (firstCard) {
              firstCard.focus();
              break;
            }
            targetColIndex += event.key === "ArrowLeft" ? -1 : 1;
          }
        }
      }}
    >
      <button
        className="drag-handle"
        type="button"
        aria-label={`Drag ${task.title}`}
        title="Drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} weight="bold" />
      </button>
      <TaskCard
        task={task}
        course={course}
        compact
        noteCount={noteCount}
        onComplete={onComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onOpenNotes={onOpenNotes}
        onStartFocus={onStartFocus}
      />
    </div>
  );
}

