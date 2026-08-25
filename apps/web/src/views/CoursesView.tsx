import { Course, RpgAttribute, Task, createCourse, rpgAttributes } from "@throughline/domain";
import { Check, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import { Button, Card, IconButton, Select, TextInput } from "../ui";

const PROJECT_COLORS = ["#3d5afe", "#1fae67", "#e8a013", "#ff5d47", "#8f6bf5", "#2aa8c4"];

function ColorPicker({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) {
  return (
    <div className="project-color-picker" role="group" aria-label={label}>
      {PROJECT_COLORS.map((swatch) => (
        <button
          key={swatch}
          type="button"
          className={`color-swatch${value === swatch ? " active" : ""}`}
          style={{ background: swatch }}
          aria-label={`Colour ${swatch}`}
          aria-pressed={value === swatch}
          onClick={() => onChange(swatch)}
        />
      ))}
    </div>
  );
}

export function CoursesView({
  courses,
  tasks,
  onUpsertCourse,
  onDeleteCourse,
  highlightedProjectId
}: {
  courses: Course[];
  tasks: Task[];
  onUpsertCourse: (course: Course) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  highlightedProjectId?: string | null;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PROJECT_COLORS[0]);
  const [attribute, setAttribute] = useState<RpgAttribute | "">("");
  const [editAttribute, setEditAttribute] = useState<RpgAttribute | "">("");

  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.courseId) {
      counts.set(task.courseId, (counts.get(task.courseId) ?? 0) + 1);
    }
  }

  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const course = createCourse({ name: trimmed, color, icon: trimmed.slice(0, 1).toUpperCase() });
    if (attribute) {
      course.defaultAttributes = [attribute as RpgAttribute];
    }
    await onUpsertCourse(course);
    setName("");
    setAttribute("");
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditColor(course.color ?? PROJECT_COLORS[0]);
    setEditAttribute(course.defaultAttributes?.[0] ?? "");
  }

  async function saveEdit(course: Course) {
    const trimmed = editName.trim();
    if (!trimmed) {
      return;
    }
    await onUpsertCourse({
      ...course,
      name: trimmed,
      color: editColor,
      defaultAttributes: editAttribute ? [editAttribute as RpgAttribute] : undefined
    });
    setEditingId(null);
  }

  return (
    <div className="view-layout">
      <header className="view-head">
        <div>
          <span className="eyebrow">Organise</span>
          <h1 className="view-title">Projects</h1>
          <p className="view-head-sub">Group related tasks, goals, and notes. Pick a project when you create them.</p>
        </div>
      </header>

      <Card className="settings-card">
        <div className="project-rows">
          {courses.length ? (
            courses.map((course) =>
              editingId === course.id ? (
                <form
                  key={course.id}
                  className="project-row-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveEdit(course);
                  }}
                >
                  <TextInput
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    aria-label={`Rename ${course.name}`}
                    autoFocus
                    style={{ flex: "1 1 160px" }}
                  />
                  <Select
                    value={editAttribute}
                    onChange={(event) => setEditAttribute(event.target.value as RpgAttribute | "")}
                    aria-label="Default attribute"
                    style={{ width: "auto", minHeight: 38 }}
                  >
                    <option value="">No attribute</option>
                    {rpgAttributes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                  <ColorPicker value={editColor} onChange={setEditColor} label="Project colour" />
                  <IconButton label={`Save ${course.name}`} size="sm" type="submit" className="!bg-[var(--green)]">
                    <Check size={14} weight="bold" />
                  </IconButton>
                  <IconButton label="Cancel edit" size="sm" onClick={() => setEditingId(null)}>
                    <X size={14} weight="bold" />
                  </IconButton>
                </form>
              ) : (
                <div
                  key={course.id}
                  className={`project-row${highlightedProjectId === course.id ? " active" : ""}`}
                  style={{ "--project-color": course.color } as React.CSSProperties}
                >
                  <span className="project-dot" aria-hidden="true" />
                  <span className="project-row-name">{course.name}</span>
                  <span className="project-row-count">{counts.get(course.id) ?? 0}</span>
                  <IconButton label={`Edit ${course.name}`} size="sm" onClick={() => startEdit(course)}>
                    <PencilSimple size={13} weight="bold" />
                  </IconButton>
                  <IconButton label={`Delete ${course.name}`} size="sm" onClick={() => void onDeleteCourse(course.id)}>
                    <Trash size={13} weight="bold" />
                  </IconButton>
                </div>
              )
            )
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">No projects yet. Add one to group related tasks and goals.</p>
          )}
        </div>

        <form className="project-add" onSubmit={addProject}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New project name"
            aria-label="New project name"
          />
          <Select
            value={attribute}
            onChange={(event) => setAttribute(event.target.value as RpgAttribute | "")}
            aria-label="Default attribute"
            style={{ width: "auto" }}
          >
            <option value="">No attribute</option>
            {rpgAttributes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <ColorPicker value={color} onChange={setColor} label="Project colour" />
          <Button variant="accent" type="submit">
            <Plus size={15} weight="bold" /> Add project
          </Button>
        </form>
      </Card>
    </div>
  );
}

