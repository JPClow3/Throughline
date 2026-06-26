import { useMemo } from "react";
import { Note } from "@throughline/domain";
import MiniSearch from "minisearch";

export function useNotesSearch(notes: Note[], query: string) {
  const miniSearch = useMemo(() => {
    const search = new MiniSearch({
      fields: ["title", "body"],
      storeFields: ["id"],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true
      }
    });
    search.addAll(notes);
    return search;
  }, [notes]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) {
      return null;
    }
    return miniSearch.search(q);
  }, [miniSearch, query]);

  const filteredNotes = useMemo(() => {
    if (!searchResults) {
      return notes;
    }
    // Maintain order returned by MiniSearch for relevance
    const noteMap = new Map(notes.map((n) => [n.id, n]));
    return searchResults.map((r) => noteMap.get(r.id)).filter(Boolean) as Note[];
  }, [notes, searchResults]);

  return { filteredNotes, searchResults };
}
