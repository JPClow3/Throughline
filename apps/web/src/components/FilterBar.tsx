import { Course, Goal, taskStatuses, kanbanColumns } from "@throughline/domain";
import { MagnifyingGlass as Search, Tag } from "@phosphor-icons/react";
import { FilterState } from "../hooks/useFilters";

type FilterBarProps = {
  courses: Course[];
  goals?: Goal[];
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  showDateFilter?: boolean;
  showStatusFilter?: boolean;
};

export function FilterBar({
  courses,
  goals = [],
  filters,
  setFilter,
  showDateFilter = true,
  showStatusFilter = false,
}: FilterBarProps) {
  return (
    <div className="view-toolbar">
      <label className="toolbar-search">
        <Search size={15} />
        <input
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
        />
      </label>
      <select
        className="toolbar-filter"
        value={filters.projectId}
        onChange={(event) => setFilter("projectId", event.target.value)}
        aria-label="Filter by project"
      >
        <option value="">All projects</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
        <option value="__none">No project</option>
      </select>
      <label className="toolbar-search" style={{ minWidth: "120px" }}>
        <Tag size={15} />
        <input
          value={filters.tags || ""}
          onChange={(event) => setFilter("tags", event.target.value)}
          placeholder="Filter tags (csv)"
          aria-label="Filter by tags"
        />
      </label>
      {goals && goals.length > 0 ? (
        <select
          className="toolbar-filter"
          value={filters.goalId}
          onChange={(event) => setFilter("goalId", event.target.value)}
          aria-label="Filter by goal"
        >
          <option value="">All goals</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
          <option value="__none">No goal</option>
        </select>
      ) : null}
      {showDateFilter && (
        <select
          className="toolbar-filter"
          value={filters.dateRange}
          onChange={(event) => setFilter("dateRange", event.target.value)}
          aria-label="Filter by date"
        >
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="next7">Next 7 days</option>
          <option value="overdue">Overdue</option>
          <option value="none">No due date</option>
        </select>
      )}
      {showStatusFilter && (
        <select
          className="toolbar-filter"
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {kanbanColumns[status]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
