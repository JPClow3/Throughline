import { Course, Goal, Note, Task, TaskStatus, kanbanColumns, taskStatuses } from "@throughline/domain";
import { DndContext, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical as GripVertical } from "@phosphor-icons/react";
import { useMemo, type ReactNode } from "react";
import { FilterBar } from "./FilterBar";
import { useFilters } from "../hooks/useFilters";
import { countNotesByTask } from "../lib/noteCounts";
import { TaskCard } from "./TaskCard";

type KanbanBoardProps = {
  tasks: Task[];
  courses: Course[];
  goals?: Goal[];
  notes?: Note[];
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onOpenNotes?: () => void;
  onStartFocus?: (task: Task) => void;
};

type DragEndEvent = {
  active: { id: string | number };
  over: { id: string | number } | null;
};

export function KanbanBoard({
  tasks,
  courses,
  goals = [],
  notes = [],
  showGameLayer = false,
  onComplete,
  onStatusChange,
  onEdit,
  onUpdateTask,
  onOpenNotes,
  onStartFocus
}: KanbanBoardProps) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const noteCounts = countNotesByTask(notes);
  const { filters, setFilter, applyFilters } = useFilters();
  const filteredTasks = useMemo(() => applyFilters(tasks, false, true), [tasks, applyFilters]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const task = tasks.find((item) => item.id === active.id);
    const overTask = tasks.find((item) => item.id === over.id);
    const status = taskStatuses.includes(over.id as TaskStatus) ? (over.id as TaskStatus) : overTask?.status;

    if (task && status && task.status !== status) {
      onStatusChange(task.id, status);
    }
  }

  return (
    <div>
      <header className="view-head">
        <div>
          <span className="eyebrow">Workflow</span>
          <h1>Board</h1>
        </div>
        <FilterBar courses={courses} goals={goals} filters={filters} setFilter={setFilter} showDateFilter={true} showStatusFilter={false} />
      </header>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <section className="kanban-board" aria-label="Kanban board">
        {taskStatuses.map((status) => {
          const columnTasks = filteredTasks.filter((task) => task.status === status);
          return (
            <KanbanColumn key={status} status={status} tasks={columnTasks}>
              <SortableContext items={columnTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                {columnTasks.map((task) => (
                  <SortableQuest
                    key={task.id}
                    task={task}
                    course={courseMap.get(task.courseId ?? "")}
                    noteCount={noteCounts.get(task.id) ?? 0}
                    showGameLayer={showGameLayer}
                    onComplete={onComplete}
                    onStatusChange={onStatusChange}
                    onEdit={onEdit}
                    onUpdateTask={onUpdateTask}
                    onOpenNotes={onOpenNotes}
                    onStartFocus={onStartFocus}
                  />
                ))}
              </SortableContext>
            </KanbanColumn>
          );
        })}
        </section>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ status, tasks, children }: { status: TaskStatus; tasks: Task[]; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? "is-over" : ""}`}>
      <header>
        <h2>{kanbanColumns[status]}</h2>
        <span>{tasks.length}</span>
      </header>
      <div className="kanban-stack">{children}</div>
    </div>
  );
}

function SortableQuest({
  task,
  course,
  noteCount,
  showGameLayer,
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
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        
        if (e.key === "Enter") {
          e.preventDefault();
          onEdit(task);
          return;
        }
        if (e.key === " ") {
          e.preventDefault();
          onComplete(task);
          return;
        }
        if (e.ctrlKey) {
          if (e.key === "ArrowLeft") {
            const currentIndex = taskStatuses.indexOf(task.status);
            if (currentIndex > 0) {
              e.preventDefault();
              onStatusChange(task.id, taskStatuses[currentIndex - 1]);
              setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 0);
            }
          } else if (e.key === "ArrowRight") {
            const currentIndex = taskStatuses.indexOf(task.status);
            if (currentIndex < taskStatuses.length - 1) {
              e.preventDefault();
              onStatusChange(task.id, taskStatuses[currentIndex + 1]);
              setTimeout(() => document.getElementById(`task-card-${task.id}`)?.focus(), 0);
            }
          }
        } else {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const parent = e.currentTarget.parentElement;
            if (!parent) return;
            const siblings = Array.from(parent.querySelectorAll('.sortable-quest'));
            const index = siblings.indexOf(e.currentTarget);
            if (e.key === "ArrowDown" && index < siblings.length - 1) {
              (siblings[index + 1] as HTMLElement).focus();
            } else if (e.key === "ArrowUp" && index > 0) {
              (siblings[index - 1] as HTMLElement).focus();
            }
          } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const currentColumn = e.currentTarget.closest('.kanban-column');
            if (!currentColumn) return;
            const columns = Array.from(document.querySelectorAll('.kanban-column'));
            let targetColIndex = columns.indexOf(currentColumn) + (e.key === "ArrowLeft" ? -1 : 1);
            
            while (targetColIndex >= 0 && targetColIndex < columns.length) {
              const targetCol = columns[targetColIndex];
              const firstTask = targetCol.querySelector('.sortable-quest') as HTMLElement;
              if (firstTask) {
                firstTask.focus();
                break;
              }
              targetColIndex += (e.key === "ArrowLeft" ? -1 : 1);
            }
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
        <GripVertical size={16} />
      </button>
      <TaskCard
        task={task}
        course={course}
        compact
        noteCount={noteCount}
        showGameLayer={showGameLayer}
        onComplete={onComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onUpdateTask={onUpdateTask}
        onOpenNotes={onOpenNotes}
        onStartFocus={onStartFocus}
      />
    </div>
  );
}
