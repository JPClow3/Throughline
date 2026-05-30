import { Note } from "@throughline/domain";

/** Map of taskId -> number of notes linked to it, for showing a note glyph on cards. */
export function countNotesByTask(notes: Note[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const taskId of note.taskIds) {
      counts.set(taskId, (counts.get(taskId) ?? 0) + 1);
    }
  }
  return counts;
}
