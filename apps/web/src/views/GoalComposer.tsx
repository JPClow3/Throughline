import { Course, Goal } from "@throughline/domain";
import { Plus } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import type { GoalInput } from "../data/repositories";
import { Button, Field, Select, TextInput } from "../ui";

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function GoalComposer({
  courses,
  goal,
  onSubmit
}: {
  courses: Course[];
  goal?: Goal;
  onSubmit: (input: GoalInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [summary, setSummary] = useState(goal?.summary ?? "");
  const [projectId, setProjectId] = useState(goal?.projectId ?? "");
  const [targetDate, setTargetDate] = useState(toDateInput(goal?.targetDate));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await onSubmit({
      title: trimmed,
      summary: summary.trim() || undefined,
      projectId: projectId || undefined,
      targetDate: targetDate || undefined,
      color: projectId ? courses.find((course) => course.id === projectId)?.color : goal?.color
    });
  }

  return (
    <form className="composer-form" onSubmit={submit}>
      <Field label="Goal">
        <TextInput
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What do you want to achieve?"
        />
      </Field>
      <Field label="Summary">
        <TextInput value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="A short why (optional)" />
      </Field>
      <div className="composer-grid">
        <Field label="Project">
          <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">None</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target date">
          <TextInput type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
        </Field>
      </div>
      <div>
        <Button variant="primary" type="submit">
          <Plus size={15} weight="bold" /> {goal ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
}
