import { useCallback, useEffect, useState } from "react";
import { Task } from "@throughline/domain";
import { useLiveQuery } from "dexie-react-hooks";
import {
  defaultFilterPresets,
  defaultFilterState,
  getFilterSettings,
  saveFilterSettings
} from "../data/repositories";
import type { PersistedFilterState, SavedFilterPreset } from "../data/types";

export type FilterState = PersistedFilterState;

export function useFilters() {
  const settings = useLiveQuery(() => getFilterSettings(), []);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const presets = settings?.presets ?? defaultFilterPresets;

  useEffect(() => {
    if (settings) {
      const timeout = window.setTimeout(() => setFilters(settings.current), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [settings]);

  const persist = useCallback(
    (next: FilterState, nextPresets: SavedFilterPreset[] = presets) => {
      setFilters(next);
      void saveFilterSettings({ current: next, presets: nextPresets });
    },
    [presets]
  );

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    persist({ ...filters, [key]: value });
  };

  const applyFilters = useCallback((tasks: Task[], ignoreDateFilter = false, ignoreStatusFilter = false) => {
    const query = filters.search.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const filterTags = filters.tags.map(t => t.trim().toLowerCase()).filter(Boolean);

    return tasks.filter((task) => {
      const matchesProject = !filters.projectId || (filters.projectId === "__none" ? !task.courseId : task.courseId === filters.projectId);
      const matchesGoal = !filters.goalId || (filters.goalId === "__none" ? !task.goalId : task.goalId === filters.goalId);
      const matchesSearch = !query || task.title.toLowerCase().includes(query) || (task.description && task.description.toLowerCase().includes(query));
      const matchesPriority =
        !filters.priority ||
        task.priority === filters.priority ||
        (filters.priority === "high" && task.priority === "critical");
      const matchesStatus = ignoreStatusFilter || !filters.status || task.status === filters.status;
      
      let matchesTags = true;
      if (filterTags.length > 0) {
        matchesTags = filterTags.every(ft => (task.tags || []).some(tt => tt.toLowerCase().includes(ft)));
      }

      let matchesDate = true;
      if (!ignoreDateFilter && filters.dateRange && filters.dateRange !== "all") {
        if (!task.dueAt) {
          matchesDate = filters.dateRange === "none";
        } else {
          const due = new Date(task.dueAt);
          const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
          const dayDiff = Math.round((startOfDue - startOfToday) / 86_400_000);
          
          if (filters.dateRange === "overdue") {
            matchesDate = dayDiff < 0 && task.status !== "done";
          } else if (filters.dateRange === "today") {
            matchesDate = dayDiff === 0;
          } else if (filters.dateRange === "next7") {
            matchesDate = dayDiff >= 0 && dayDiff <= 7;
          }
        }
      }

      return matchesProject && matchesGoal && matchesSearch && matchesPriority && matchesStatus && matchesTags && matchesDate;
    });
  }, [filters]);

  const applyPreset = useCallback((preset: SavedFilterPreset) => persist(preset.filters), [persist]);
  const clearFilters = useCallback(() => persist(defaultFilterState), [persist]);
  const saveCurrentPreset = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const nextPreset: SavedFilterPreset = {
        id: `custom-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        name: trimmed,
        filters
      };
      persist(filters, [...presets.filter((preset) => preset.name !== trimmed), nextPreset]);
    },
    [filters, persist, presets]
  );

  return { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset };
}
