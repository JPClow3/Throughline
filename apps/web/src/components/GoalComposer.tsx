import { Course, Goal } from "@throughline/domain";
import { Plus } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import type { GoalInput } from "../data/repositories";

type GoalComposerProps = {
  courses: Course[];
  /** When provided, the form edits this goal instead of creating a new one. */
  goal?: Goal;
  onSubmit: (input: GoalInput) => Promise<void>;
};

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function GoalComposer({ courses, goal, onSubmit }: GoalComposerProps) {
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
      <label>
        <span>Goal</span>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What do you want to achieve?"
        />
      </label>
      <label>
        <span>Summary</span>
        <input
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="A short why (optional)"
        />
      </label>
      <div className="composer-grid">
        <label>
          <span>Project</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">None</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Target date</span>
          <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
        </label>
      </div>
      <button className="primary-button" type="submit">
        <Plus size={17} /> {goal ? "Save changes" : "Create goal"}
      </button>
    </form>
  );
}
