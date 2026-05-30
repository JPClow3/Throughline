import { Course, Note, Task, TaskStatus, kanbanColumns, taskStatuses } from "@liquidglass-todo/domain";
import { DndContext, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical as GripVertical, MagnifyingGlass as Search } from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import { countNotesByTask } from "../lib/noteCounts";
import { TaskCard } from "./TaskCard";

type KanbanBoardProps = {
  tasks: Task[];
  courses: Course[];
  notes?: Note[];
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
};

type DragEndEvent = {
  active: { id: string | number };
  over: { id: string | number } | null;
};

export function KanbanBoard({
  tasks,
  courses,
  notes = [],
  showGameLayer = false,
  onComplete,
  onStatusChange,
  onEdit,
  onOpenNotes
}: KanbanBoardProps) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const noteCounts = countNotesByTask(notes);
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesProject =
        !projectFilter ||
        (projectFilter === "__none" ? !task.courseId : task.courseId === projectFilter);
      const matchesSearch = !query || task.title.toLowerCase().includes(query);
      return matchesProject && matchesSearch;
    });
  }, [tasks, projectFilter, search]);

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
        <div className="view-toolbar">
          <label className="toolbar-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
            />
          </label>
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
      </header>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
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
                    onOpenNotes={onOpenNotes}
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
  onOpenNotes
}: {
  task: Task;
  course?: Course;
  noteCount?: number;
  showGameLayer?: boolean;
  onComplete: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onOpenNotes?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    resizeObserverConfig: {}
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "sortable-quest dragging" : "sortable-quest"}
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
        onOpenNotes={onOpenNotes}
      />
    </div>
  );
}
