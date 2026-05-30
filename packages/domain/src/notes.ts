import { Note } from "./types";

/** Notes linked to a given task. */
export function notesForTask(taskId: string, notes: Note[]): Note[] {
  return notes.filter((note) => note.taskIds.includes(taskId));
}

/** Notes linked to a given goal. */
export function notesForGoal(goalId: string, notes: Note[]): Note[] {
  return notes.filter((note) => note.goalIds.includes(goalId));
}

/** Case-insensitive search across note title and body. */
export function searchNotes(query: string, notes: Note[]): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return notes;
  }
  return notes.filter(
    (note) => note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)
  );
}

/** A short plain-text preview of a note body, with light markdown stripped. */
export function noteExcerpt(body: string, max = 140): string {
  const text = body
    .replace(/[#*_`>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** A display title for a note, falling back to its first body line when untitled. */
export function noteDisplayTitle(note: Note): string {
  if (note.title.trim()) {
    return note.title.trim();
  }
  const firstLine = note.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? firstLine.replace(/^#+\s*/, "").slice(0, 80) : "Untitled note";
}
