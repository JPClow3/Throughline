import { Course, RpgAttribute, Task, createCourse, rpgAttributes } from "@throughline/domain";
import { Check, FolderOpen, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import { Button, Card, ConfirmDialog, EmptyState, IconButton, Select, TextInput } from "../ui";

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
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [busy, setBusy] = useState(false);

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
      setError("Give the project a name first.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const course = createCourse({ name: trimmed, color, icon: trimmed.slice(0, 1).toUpperCase() });
      if (attribute) {
        course.defaultAttributes = [attribute as RpgAttribute];
      }
      await onUpsertCourse(course);
      setName("");
      setAttribute("");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditColor(course.color ?? PROJECT_COLORS[0]);
    setEditAttribute(course.defaultAttributes?.[0] ?? "");
    setEditError("");
  }

  async function saveEdit(course: Course) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("The project needs a name.");
      return;
    }
    setBusy(true);
    try {
      await onUpsertCourse({
        ...course,
        name: trimmed,
        color: editColor,
        defaultAttributes: editAttribute ? [editAttribute as RpgAttribute] : undefined
      });
      setEditingId(null);
    } finally {
      setBusy(false);
    }
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
                    onChange={(event) => {
                      setEditName(event.target.value);
                      if (editError) setEditError("");
                    }}
                    aria-label={`Rename ${course.name}`}
                    aria-invalid={editError ? true : undefined}
                    autoFocus
                    style={{ flex: "1 1 160px" }}
                  />
                  {editError ? (
                    <p className="composer-error composer-error-inline" role="alert">
                      {editError}
                    </p>
                  ) : null}
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
                  <IconButton label={`Delete ${course.name}`} size="sm" onClick={() => setDeleteTarget(course)}>
                    <Trash size={13} weight="bold" />
                  </IconButton>
                </div>
              )
            )
          ) : (
            <EmptyState
              variant="inline"
              icon={<FolderOpen size={22} weight="bold" />}
              title="No projects yet"
              body="Add one below to group related tasks, goals, and notes."
            />
          )}
        </div>

        <form className="project-add" onSubmit={addProject}>
          <div className="project-add-field">
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError("");
              }}
              placeholder="New project name"
              aria-label="New project name"
              aria-invalid={error ? true : undefined}
            />
            {error ? (
              <p className="composer-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
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
          <Button variant="accent" type="submit" disabled={busy}>
            <Plus size={15} weight="bold" /> {busy ? "Adding…" : "Add project"}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this project?"
        message={
          counts.get(deleteTarget?.id ?? "")
            ? `"${deleteTarget?.name}" will be removed. Its ${counts.get(deleteTarget?.id ?? "")} task${counts.get(deleteTarget?.id ?? "") === 1 ? "" : "s"} stay in your planner, ungrouped.`
            : `"${deleteTarget?.name}" will be removed.`
        }
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteCourse(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

