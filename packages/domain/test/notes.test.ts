import { describe, expect, it } from "vitest";
import { createNote } from "../src/factories";
import { noteDisplayTitle, noteExcerpt, notesForGoal, notesForTask, searchNotes } from "../src/notes";

describe("notes", () => {
  it("links notes to tasks and goals many-to-many", () => {
    const notes = [
      createNote({ title: "A", taskIds: ["t1"], goalIds: ["g1"] }),
      createNote({ title: "B", taskIds: ["t2"] }),
      createNote({ title: "C", goalIds: ["g1"] })
    ];

    expect(notesForTask("t1", notes).map((note) => note.title)).toEqual(["A"]);
    expect(notesForGoal("g1", notes).map((note) => note.title)).toEqual(["A", "C"]);
  });

  it("searches title and body case-insensitively", () => {
    const notes = [
      createNote({ title: "Calculus", body: "limits and continuity" }),
      createNote({ title: "History", body: "fall of Rome" })
    ];

    expect(searchNotes("ROME", notes).map((note) => note.title)).toEqual(["History"]);
    expect(searchNotes("", notes)).toHaveLength(2);
  });

  it("falls back to the first body line for an untitled note", () => {
    expect(noteDisplayTitle(createNote({ body: "# Heading\nrest of the note" }))).toBe("Heading");
    expect(noteDisplayTitle(createNote({}))).toBe("Untitled note");
  });

  it("builds a trimmed plain-text excerpt", () => {
    expect(noteExcerpt("# Title\n\nSome **bold** text")).toContain("Some bold text");
  });
});
