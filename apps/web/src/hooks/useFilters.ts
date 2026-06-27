import { useState, useEffect, useCallback } from "react";
import { Task } from "@throughline/domain";

export type FilterState = {
  search: string;
  projectId: string;
  goalId: string;
  dateRange: string;
  status: string;
  priority: string;
  tags: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  projectId: "",
  goalId: "",
  dateRange: "all",
  status: "",
  priority: "",
  tags: "",
};

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem("throughline_filters");
      return stored ? { ...DEFAULT_FILTERS, ...JSON.parse(stored) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("throughline_filters", JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = useCallback((tasks: Task[], ignoreDateFilter = false, ignoreStatusFilter = false) => {
    const query = filters.search.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const filterTags = filters.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

    return tasks.filter((task) => {
      const matchesProject = !filters.projectId || (filters.projectId === "__none" ? !task.courseId : task.courseId === filters.projectId);
      const matchesGoal = !filters.goalId || (filters.goalId === "__none" ? !task.goalId : task.goalId === filters.goalId);
      const matchesSearch = !query || task.title.toLowerCase().includes(query) || (task.description && task.description.toLowerCase().includes(query));
      const matchesPriority = !filters.priority || task.priority === filters.priority;
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

  return { filters, setFilter, applyFilters };
}
