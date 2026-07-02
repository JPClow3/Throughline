import { Course, Goal, taskStatuses, kanbanColumns, priorities } from "@throughline/domain";
import { BookmarkSimple, FunnelSimple, MagnifyingGlass as Search, Tag } from "@phosphor-icons/react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FilterState } from "../hooks/useFilters";
import type { SavedFilterPreset } from "../data/types";

type FilterBarProps = {
  courses: Course[];
  goals?: Goal[];
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  presets?: SavedFilterPreset[];
  availableTags?: string[];
  onApplyPreset?: (preset: SavedFilterPreset) => void;
  onClearFilters?: () => void;
  onSavePreset?: (name: string) => void;
  showDateFilter?: boolean;
  showStatusFilter?: boolean;
};

export function FilterBar({
  courses,
  goals = [],
  filters,
  setFilter,
  presets = [],
  availableTags = [],
  onApplyPreset,
  onClearFilters,
  onSavePreset,
  showDateFilter = true,
  showStatusFilter = false,
}: FilterBarProps) {
  const isCompact = useCompactFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showAdvanced = !isCompact || filtersOpen;
  const activeTagSet = new Set(filters.tags);
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.projectId) ||
    Boolean(filters.goalId) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.tags.length) ||
    Boolean(filters.dateRange && filters.dateRange !== "all");

  function toggleTag(tag: string) {
    const nextTags = activeTagSet.has(tag) ? filters.tags.filter((item) => item !== tag) : [...filters.tags, tag];
    setFilter("tags", nextTags);
  }

  function handleSavePreset() {
    const name = window.prompt("Name this filter preset");
    if (name?.trim()) {
      onSavePreset?.(name.trim());
    }
  }

  const dateOptions = [
    ["all", "All"],
    ["today", "Today"],
    ["next7", "Next 7"],
    ["overdue", "Overdue"],
    ["none", "No date"]
  ];

  return (
    <div className="view-toolbar">
      {!isCompact && presets.length ? (
        <div className="filter-chip-row" aria-label="Filter presets">
          {presets.map((preset) => (
            <button key={preset.id} type="button" className="filter-chip" onClick={() => onApplyPreset?.(preset)}>
              {preset.name}
            </button>
          ))}
        </div>
      ) : null}
      <label className="toolbar-search">
        <Search size={15} />
        <input
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
        />
      </label>
      {isCompact ? (
        <button
          type="button"
          className="secondary-button toolbar-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <FunnelSimple size={15} />
          Filters
          {hasActiveFilters ? <span className="toolbar-filter-count">{activeFilterCount(filters)}</span> : null}
        </button>
      ) : null}
      {showAdvanced ? (
        <>
          <div className="filter-chip-row filter-project-row" aria-label="Filter by project">
            <FilterChip active={!filters.projectId} onClick={() => setFilter("projectId", "")}>
              All projects
            </FilterChip>
            {courses.map((course) => (
              <FilterChip
                key={course.id}
                active={filters.projectId === course.id}
                onClick={() => setFilter("projectId", course.id)}
                style={{ "--project-color": course.color } as CSSProperties}
              >
                <span className="project-dot" aria-hidden="true" />
                {course.code ?? course.name}
              </FilterChip>
            ))}
            <FilterChip active={filters.projectId === "__none"} onClick={() => setFilter("projectId", "__none")}>
              No project
            </FilterChip>
          </div>
          <div className="filter-chip-row" aria-label="Filter by tags">
            <Tag size={15} className="text-on-surface-variant" />
            {availableTags.length ? (
              availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-chip${activeTagSet.has(tag) ? " active" : ""}`}
                  aria-pressed={activeTagSet.has(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))
            ) : (
              <span className="font-label-sm text-label-sm text-on-surface-variant">No tags</span>
            )}
          </div>
          {goals && goals.length > 0 ? (
            <div className="filter-chip-row" aria-label="Filter by goal">
              <FilterChip active={!filters.goalId} onClick={() => setFilter("goalId", "")}>
                All goals
              </FilterChip>
              {goals.map((goal) => (
                <FilterChip key={goal.id} active={filters.goalId === goal.id} onClick={() => setFilter("goalId", goal.id)}>
                  {goal.title}
                </FilterChip>
              ))}
              <FilterChip active={filters.goalId === "__none"} onClick={() => setFilter("goalId", "__none")}>
                No goal
              </FilterChip>
            </div>
          ) : null}
          {showDateFilter && (
            <div className="filter-segmented" aria-label="Filter by date">
              {dateOptions.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filters.dateRange === value ? "active" : ""}
                  aria-pressed={filters.dateRange === value}
                  onClick={() => setFilter("dateRange", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="filter-chip-row" aria-label="Filter by priority">
            <FilterChip active={!filters.priority} onClick={() => setFilter("priority", "")}>
              Any priority
            </FilterChip>
            {priorities.map((priority) => (
              <FilterChip key={priority} active={filters.priority === priority} onClick={() => setFilter("priority", priority)}>
                {priority}
              </FilterChip>
            ))}
          </div>
          {showStatusFilter && (
            <div className="filter-chip-row" aria-label="Filter by status">
              <FilterChip active={!filters.status} onClick={() => setFilter("status", "")}>
                All statuses
              </FilterChip>
              {taskStatuses.map((status) => (
                <FilterChip key={status} active={filters.status === status} onClick={() => setFilter("status", status)}>
                  {kanbanColumns[status]}
                </FilterChip>
              ))}
            </div>
          )}
          {hasActiveFilters ? (
            <div className="active-filter-bar">
              <span>{activeFilterCount(filters)} active</span>
              {onSavePreset ? (
                <button type="button" className="secondary-button" onClick={handleSavePreset}>
                  <BookmarkSimple size={15} />
                  Save preset
                </button>
              ) : null}
              <button type="button" className="secondary-button" onClick={onClearFilters}>
                Clear filters
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  style
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button type="button" className={`filter-chip${active ? " active" : ""}`} aria-pressed={active} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function activeFilterCount(filters: FilterState) {
  return [
    filters.search,
    filters.projectId,
    filters.goalId,
    filters.status,
    filters.priority,
    filters.dateRange && filters.dateRange !== "all" ? filters.dateRange : "",
    ...filters.tags
  ].filter(Boolean).length;
}

function useCompactFilters() {
  const query = "(max-width: 720px)";
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return matches;
}
