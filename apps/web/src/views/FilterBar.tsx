import { Course, Goal, taskStatuses, kanbanColumns, priorities } from "@throughline/domain";
import { BookmarkSimple, FunnelSimple, MagnifyingGlass as Search, Tag } from "@phosphor-icons/react";
import { useEffect, useState, type CSSProperties } from "react";
import { FilterState } from "../hooks/useFilters";
import type { SavedFilterPreset } from "../data/types";
import { Button, Chip, Modal, ModalCloseButton, TextInput } from "../ui";

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

const DATE_OPTIONS = [
  ["all", "All"],
  ["today", "Today"],
  ["next7", "Next 7"],
  ["overdue", "Overdue"],
  ["none", "No date"]
];

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
  showStatusFilter = false
}: FilterBarProps) {
  const isCompact = useCompactFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [presetError, setPresetError] = useState("");
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

  function handleOpenSavePreset() {
    setPresetNameInput("");
    setPresetError("");
    setIsSavingPreset(true);
  }

  function handleSavePresetSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = presetNameInput.trim();
    if (!trimmed) {
      setPresetError("Please enter a name for this preset");
      return;
    }
    onSavePreset?.(trimmed);
    setIsSavingPreset(false);
  }

  return (
    <div className="view-toolbar">
      {presets.length ? (
        <div className="filter-presets-row" role="region" aria-label="Filter presets">
          {presets.map((preset) => (
            <Chip key={preset.id} onClick={() => onApplyPreset?.(preset)}>
              <BookmarkSimple size={12} weight="bold" />
              {preset.name}
            </Chip>
          ))}
        </div>
      ) : null}
      <label className="toolbar-search">
        <Search size={14} weight="bold" />
        <TextInput
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
        />
      </label>
      {isCompact ? (
        <Button size="sm" variant="primary" className="toolbar-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
          <FunnelSimple size={14} weight="bold" />
          Filters
          {hasActiveFilters ? <span className="toolbar-filter-count">{activeFilterCount(filters)}</span> : null}
        </Button>
      ) : null}
      {showAdvanced ? (
        <>
          <div className="filter-chip-row" aria-label="Filter by project">
            <Chip active={!filters.projectId} onClick={() => setFilter("projectId", "")}>
              All projects
            </Chip>
            {courses.map((course) => (
              <Chip
                key={course.id}
                active={filters.projectId === course.id}
                onClick={() => setFilter("projectId", course.id)}
                style={{ "--project-color": course.color } as CSSProperties}
              >
                <span className="project-dot" aria-hidden="true" />
                {course.code ?? course.name}
              </Chip>
            ))}
            <Chip active={filters.projectId === "__none"} onClick={() => setFilter("projectId", "__none")}>
              No project
            </Chip>
          </div>
          <div className="filter-chip-row" aria-label="Filter by tags">
            <Tag size={14} weight="bold" style={{ color: "var(--ink-soft)" }} />
            {availableTags.length ? (
              availableTags.map((tag) => (
                <Chip key={tag} active={activeTagSet.has(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </Chip>
              ))
            ) : (
              <span className="text-xs font-semibold text-[var(--ink-faint)]">No tags</span>
            )}
          </div>
          {goals && goals.length > 0 ? (
            <div className="filter-chip-row" aria-label="Filter by goal">
              <Chip active={!filters.goalId} onClick={() => setFilter("goalId", "")}>
                All goals
              </Chip>
              {goals.map((goal) => (
                <Chip key={goal.id} active={filters.goalId === goal.id} onClick={() => setFilter("goalId", goal.id)}>
                  {goal.title}
                </Chip>
              ))}
              <Chip active={filters.goalId === "__none"} onClick={() => setFilter("goalId", "__none")}>
                No goal
              </Chip>
            </div>
          ) : null}
          {showDateFilter && (
            <div className="filter-segmented" role="group" aria-label="Filter by date">
              {DATE_OPTIONS.map(([value, label]) => (
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
            <Chip active={!filters.priority} onClick={() => setFilter("priority", "")}>
              Any priority
            </Chip>
            {priorities.map((priority) => (
              <Chip key={priority} active={filters.priority === priority} onClick={() => setFilter("priority", priority)}>
                {priority}
              </Chip>
            ))}
          </div>
          {showStatusFilter && (
            <div className="filter-chip-row" aria-label="Filter by status">
              <Chip active={!filters.status} onClick={() => setFilter("status", "")}>
                All statuses
              </Chip>
              {taskStatuses.map((status) => (
                <Chip key={status} active={filters.status === status} onClick={() => setFilter("status", status)}>
                  {kanbanColumns[status]}
                </Chip>
              ))}
            </div>
          )}
          {hasActiveFilters ? (
            <div className="active-filter-bar">
              <span>{activeFilterCount(filters)} active</span>
              {onSavePreset ? (
                <Button size="sm" onClick={handleOpenSavePreset}>
                  <BookmarkSimple size={13} weight="bold" />
                  Save preset
                </Button>
              ) : null}
              <Button size="sm" variant="primary" onClick={onClearFilters}>
                Clear filters
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {isSavingPreset ? (
        <Modal title="Save filter preset" onClose={() => setIsSavingPreset(false)}>
          <form onSubmit={handleSavePresetSubmit} className="save-preset-modal">
            <ModalCloseButton onClose={() => setIsSavingPreset(false)} />
            <div className="save-preset-head">
              <div className="save-preset-icon" aria-hidden="true">
                <BookmarkSimple size={20} weight="bold" />
              </div>
              <div>
                <h2 className="save-preset-title">Save filter preset</h2>
                <p className="save-preset-sub">
                  Save current active filters as a quick preset for 1-tap access.
                </p>
              </div>
            </div>

            <label className="save-preset-field">
              <span className="save-preset-label">Preset Name</span>
              <TextInput
                autoFocus
                value={presetNameInput}
                onChange={(event) => {
                  setPresetNameInput(event.target.value);
                  if (presetError) setPresetError("");
                }}
                placeholder="e.g. Bio 101 Labs, Urgent Overdue"
                aria-label="Filter preset name"
                aria-invalid={Boolean(presetError)}
                aria-describedby={presetError ? "preset-name-error" : undefined}
              />
            </label>

            {presetError ? (
              <div id="preset-name-error" className="composer-error composer-error-inline" role="alert">
                {presetError}
              </div>
            ) : null}

            <div className="save-preset-actions">
              <Button type="button" onClick={() => setIsSavingPreset(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={!presetNameInput.trim()}>
                Save preset
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
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

export function useCompactFilters(query = "(max-width: 720px)") {
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
  }, [query]);

  return matches;
}
