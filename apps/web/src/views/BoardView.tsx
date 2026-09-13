import { Course, Task, TaskStatus, kanbanColumns, taskStatuses } from "@throughline/domain";
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FunnelSimple, Kanban, Plus, DotsSixVertical as GripVertical } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { FilterBar } from "./FilterBar";
import { useCompactFilters } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { compareBoardTasks, planBoardMove } from "../lib/board";
import { usePlanner } from "../state/PlannerProvider";
import { Button, EmptyState } from "../ui";
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
  onUpdateTask,
  onEdit,
  onOpenNotes,
  onStartFocus,
  onNewTask,
  showGameLayer = false
}: {
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Persists board moves in one batch; when absent the board falls back to status-only moves. */
  onUpdateTasks?: (updates: Task[]) => void;
  /** Enables inline subtask editing on the cards (Today/Board parity). */
  onUpdateTask?: (task: Task) => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
  onNewTask?: () => void;
  showGameLayer?: boolean;
}) {
  const { tasks, courses, goals, courseById, noteCountByTask, tags } = usePlanner();
  const { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset } = useFilters();
  const [announcement, setAnnouncement] = useState("");
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("backlog");
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set());
  const isMobileBoard = useCompactFilters("(max-width: 1100px)");
  const filteredTasks = applyFilters(tasks, false, false).sort(compareBoardTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  /** Arrow/Home/End move between status tabs on the touch board, like a real tablist. */
  function handleStatusTabKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = taskStatuses.indexOf(mobileStatus);
    let nextIndex: number;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % taskStatuses.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + taskStatuses.length) % taskStatuses.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = taskStatuses.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextStatus = taskStatuses[nextIndex];
    setMobileStatus(nextStatus);
    document.getElementById(`kanban-tab-${nextStatus}`)?.focus();
  }

  const handleCompleteTask = (target: Task) => {
    setRecentlyCompletedIds((prev) => new Set(prev).add(target.id));
    setTimeout(() => {
      setRecentlyCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }, 2000);
    onComplete(target);
    setAnnouncement(`Moved ${target.title} to Done.`);
  };

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

      {onNewTask && tasks.length === 0 ? (
        <EmptyState
          icon={<Kanban size={24} weight="bold" />}
          title="No tasks on your board"
          body="Plan your assignments and projects with a tactile Kanban board."
          action={
            <Button variant="accent" onClick={onNewTask}>
              <Plus size={16} weight="bold" />
              Capture a task
            </Button>
          }
        />
      ) : tasks.length > 0 && filteredTasks.length === 0 ? (
        <EmptyState
          icon={<FunnelSimple size={24} weight="bold" />}
          title="No matching tasks"
          body="No tasks match the active filters or search terms."
          action={
            <Button variant="primary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : isMobileBoard ? (
        <section className="kanban-mobile" aria-label="Kanban board">
          <div className="kanban-mobile-tabs" role="tablist" aria-label="Choose workflow status" onKeyDown={handleStatusTabKeys}>
            {taskStatuses.map((status) => {
              const count = filteredTasks.filter((task) => task.status === status).length;
              const active = mobileStatus === status;
              return (
                <button
                  key={status}
                  id={`kanban-tab-${status}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="kanban-mobile-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => setMobileStatus(status)}
                >
                  <span>{kanbanColumns[status]}</span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
          <div
            id="kanban-mobile-panel"
            className="kanban-mobile-list"
            role="tabpanel"
            aria-labelledby={`kanban-tab-${mobileStatus}`}
            tabIndex={0}
          >
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
                    showGameLayer={showGameLayer}
                    noteCount={noteCountByTask.get(task.id) ?? 0}
                    justCompleted={recentlyCompletedIds.has(task.id)}
                    onComplete={handleCompleteTask}
                    onStatusChange={(taskId, status) => {
                      const target = tasks.find((item) => item.id === taskId) ?? task;
                      moveTo(target.id, status);
                    }}
                    onEdit={onEdit}
                    onUpdateTask={onUpdateTask}
                    offerEmptyStepInput={false}
                    onOpenNotes={onOpenNotes}
                    onStartFocus={onStartFocus}
                  />
                </div>
              ))}
              {filteredTasks.filter((task) => task.status === mobileStatus).length === 0 ? (
                <ColumnEmpty status={mobileStatus} onNewTask={onNewTask} />
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
                        showGameLayer={showGameLayer}
                        justCompleted={recentlyCompletedIds.has(task.id)}
                        onComplete={handleCompleteTask}
                        onStatusChange={(taskId, nextStatus) => {
                          const target = tasks.find((item) => item.id === taskId) ?? task;
                          moveTo(target.id, nextStatus);
                        }}
                        onEdit={onEdit}
                        onUpdateTask={onUpdateTask}
                        onOpenNotes={onOpenNotes}
                        onStartFocus={onStartFocus}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 ? <ColumnEmpty status={status} onNewTask={onNewTask} /> : null}
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

/** Empty column placeholder: state plus a real next step, per the "no dead affordances" rule. */
function ColumnEmpty({ status, onNewTask }: { status: TaskStatus; onNewTask?: () => void }) {
  return (
    <div className="kanban-empty">
      <p className="kanban-empty-state">No tasks in {kanbanColumns[status].toLowerCase()}.</p>
      {onNewTask ? (
        <Button size="sm" onClick={onNewTask} aria-label={`Add a task to ${kanbanColumns[status]}`}>
          <Plus size={14} weight="bold" /> Add task
        </Button>
      ) : null}
    </div>
  );
}

function SortableQuest({
  task,
  course,
  noteCount,
  showGameLayer,
  justCompleted,
  onComplete,
  onStatusChange,
  onEdit,
  onUpdateTask,
  onOpenNotes,
  onStartFocus
}: {
  task: Task;
  course?: Course;
  noteCount?: number;
  showGameLayer?: boolean;
  justCompleted?: boolean;
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
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
        showGameLayer={showGameLayer}
        noteCount={noteCount}
        justCompleted={justCompleted}
        onComplete={onComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onUpdateTask={onUpdateTask}
        offerEmptyStepInput={false}
        onOpenNotes={onOpenNotes}
        onStartFocus={onStartFocus}
      />
    </div>
  );
}

