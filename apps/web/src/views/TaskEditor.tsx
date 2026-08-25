import { Course, Goal, Priority, Task, TaskStatus, kanbanColumns, priorities, taskStatuses } from "@throughline/domain";
import { DotsSixVertical as GripVertical, Plus, Trash } from "@phosphor-icons/react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useState } from "react";
import { Button, Field, Select, TextArea, TextInput } from "../ui";

function toLocalInput(iso?: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TaskEditor({
  task,
  courses,
  goals = [],
  onSave,
  onDelete
}: {
  task: Task;
  courses: Course[];
  goals?: Goal[];
  onSave: (task: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(task.title);
  const [courseId, setCourseId] = useState(task.courseId ?? "");
  const [goalId, setGoalId] = useState(task.goalId ?? "");
  const [dueAt, setDueAt] = useState(toLocalInput(task.dueAt));
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [description, setDescription] = useState(task.description);
  const [tags, setTags] = useState(task.tags.join(", "));
  const [subtasks, setSubtasks] = useState([...task.subtasks]);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "custom" | "">(
    task.recurrence?.pattern ?? ""
  );
  const [attributes, setAttributes] = useState(task.attributes);

  function addSubtask() {
    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: "", completed: false }]);
  }

  function updateSubtask(index: number, updates: Partial<{ title: string; completed: boolean }>) {
    const next = [...subtasks];
    next[index] = { ...next[index], ...updates };
    setSubtasks(next);
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, itemIndex) => itemIndex !== index));
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: { active: { id: string | number }; over: { id: string | number } | null }) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSubtasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    await onSave({
      ...task,
      title: title.trim(),
      courseId: courseId || undefined,
      goalId: goalId || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      status,
      priority,
      description: description.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      subtasks: subtasks.map((subtask) => ({ ...subtask, title: subtask.title.trim() })).filter((subtask) => subtask.title),
      recurrence: recurrence ? { pattern: recurrence as "daily" | "weekly" | "biweekly" | "monthly" | "custom" } : undefined,
      attributes,
      completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : undefined
    });
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <Field label="Title">
        <TextInput autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} />
      </Field>
      <div className="composer-grid">
        <Field label="Project">
          <Select
            value={courseId}
            onChange={(event) => {
              const nextCourseId = event.target.value;
              setCourseId(nextCourseId);
              const course = courses.find((item) => item.id === nextCourseId);
              if (course?.defaultAttributes?.length) {
                setAttributes(course.defaultAttributes);
              }
            }}
          >
            <option value="">None</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code ?? course.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due">
          <TextInput type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </Field>
      </div>
      <div className="composer-grid">
        <Field label="Status">
          <Select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            {taskStatuses.map((value) => (
              <option key={value} value={value}>
                {kanbanColumns[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {goals.length ? (
        <Field label="Goal">
          <Select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
            <option value="">No goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Description">
        <TextArea value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>

      <div className="subtasks-editor">
        <span>Subtasks</span>
        <div className="subtasks-list">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
              {subtasks.map((subtask, index) => (
                <SortableSubtask
                  key={subtask.id}
                  subtask={subtask}
                  index={index}
                  updateSubtask={updateSubtask}
                  removeSubtask={removeSubtask}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div>
          <Button onClick={addSubtask}>
            <Plus size={14} weight="bold" /> Add step
          </Button>
        </div>
      </div>

      <div className="composer-grid">
        <Field label="Recurrence">
          <Select
            value={recurrence}
            onChange={(event) => setRecurrence(event.target.value as "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "")}
          >
            <option value="">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>
        <Field label="Tags">
          <TextInput value={tags} onChange={(event) => setTags(event.target.value)} placeholder="reading, errand" />
        </Field>
      </div>

      <div className="button-row editor-actions">
        <Button variant="primary" type="submit">
          Save changes
        </Button>
        <Button variant="danger" onClick={() => void onDelete(task.id)}>
          <Trash size={15} weight="bold" /> Delete
        </Button>
      </div>
    </form>
  );
}

function SortableSubtask({
  subtask,
  index,
  updateSubtask,
  removeSubtask
}: {
  subtask: { id: string; title: string; completed: boolean };
  index: number;
  updateSubtask: (index: number, updates: Partial<{ title: string; completed: boolean }>) => void;
  removeSubtask: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
    resizeObserverConfig: {}
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className="subtask-edit-row">
      <button
        type="button"
        style={{ background: "transparent", border: "none", cursor: "grab", color: "var(--ink-muted)", padding: 0 }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} />
      </button>
      <input
        type="checkbox"
        className="checkbox"
        checked={subtask.completed}
        onChange={(event) => updateSubtask(index, { completed: event.target.checked })}
      />
      <TextInput
        value={subtask.title}
        onChange={(event) => updateSubtask(index, { title: event.target.value })}
        placeholder="Subtask title"
      />
      <Button size="sm" variant="danger" aria-label="Delete subtask" onClick={() => removeSubtask(index)}>
        <Trash size={13} weight="bold" />
      </Button>
    </div>
  );
}
