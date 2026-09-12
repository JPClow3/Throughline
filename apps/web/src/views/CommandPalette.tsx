import { Command } from "cmdk";
import {
  CalendarDots,
  ChartLine,
  FolderSimple,
  GearSix,
  House,
  Kanban,
  MagnifyingGlass,
  Moon,
  Note as FileText,
  Plus,
  Sun,
  Target
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { AppView } from "../shell/AppShell";
import type { Course, Goal, Note as PlannerNote, Task } from "@throughline/domain";
import type { GlobalSearchResult } from "../hooks/useGlobalSearch";
import { useGlobalSearch } from "../hooks/useGlobalSearch";

type CommandPaletteProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onNewTask: () => void;
  onToggleTheme: () => void;
  searchResults?: GlobalSearchResult[];
  onOpenResult?: (result: GlobalSearchResult) => void;
  tasks?: Task[];
  notes?: PlannerNote[];
  goals?: Goal[];
  courses?: Course[];
};

const ITEM_CLASS = "palette-item";

function NavItem({
  icon,
  label,
  onSelect
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item value={label} onSelect={onSelect} className={ITEM_CLASS}>
      <span aria-hidden="true">{icon}</span>
      <span className="palette-item-title">{label}</span>
    </Command.Item>
  );
}

export function CommandPalette({
  open,
  setOpen,
  onNavigate,
  onNewTask,
  onToggleTheme,
  searchResults = [],
  onOpenResult,
  tasks = [],
  notes = [],
  goals = [],
  courses = []
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const liveResults = useGlobalSearch({ query, tasks, notes, goals, courses });
  const visibleResults = searchResults.length ? searchResults : liveResults;
  const resultGroups = groupResults(visibleResults);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && !active.closest("[cmdk-root]")) {
        previousActiveElementRef.current = active;
      }
    } else if (previousActiveElementRef.current) {
      const toRestore = previousActiveElementRef.current;
      previousActiveElementRef.current = null;
      requestAnimationFrame(() => {
        if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
          toRestore.focus();
        }
      });
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  };

  const runCommand = (command: () => void) => {
    handleOpenChange(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="palette-backdrop fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[min(14vh,130px)]"
      shouldFilter={false}
      label="Command palette"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleOpenChange(false);
        }
      }}
    >
      <div className="palette-panel">
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search..."
          className="palette-input"
        />

        <Command.List className="palette-list custom-scrollbar">
          <Command.Empty className="palette-empty">No results found.</Command.Empty>

          {resultGroups.map(([heading, results]) => (
            <Command.Group key={heading} heading={heading} className="palette-group">
              {results.map((result) => (
                <Command.Item
                  key={`${result.type}:${result.id}`}
                  value={`${result.title} ${result.subtitle} ${result.type} ${result.actionLabel ?? ""}`}
                  onSelect={() => runCommand(() => onOpenResult?.(result))}
                  className={ITEM_CLASS}
                >
                  <MagnifyingGlass size={16} weight="bold" />
                  <span className="palette-item-main">
                    <span className="palette-item-title">{result.title}</span>
                    <span className="palette-item-subtitle">{result.subtitle}</span>
                  </span>
                  {result.actionLabel ? <span className="palette-item-action">{result.actionLabel}</span> : null}
                </Command.Item>
              ))}
            </Command.Group>
          ))}

          <Command.Group heading="Actions" className="palette-group">
            <Command.Item onSelect={() => runCommand(onNewTask)} className={ITEM_CLASS}>
              <Plus size={16} weight="bold" />
              <span className="palette-item-title">Create new task</span>
              <span className="palette-item-action" aria-hidden="true">
                N
              </span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Navigation" className="palette-group">
            <NavItem icon={<House size={16} weight="bold" />} label="Go to Today" onSelect={() => runCommand(() => onNavigate("dashboard"))} />
            <NavItem icon={<Target size={16} weight="bold" />} label="Go to Goals" onSelect={() => runCommand(() => onNavigate("goals"))} />
            <NavItem icon={<Kanban size={16} weight="bold" />} label="Go to Board" onSelect={() => runCommand(() => onNavigate("kanban"))} />
            <NavItem icon={<CalendarDots size={16} weight="bold" />} label="Go to Timeline" onSelect={() => runCommand(() => onNavigate("timeline"))} />
            <NavItem icon={<FileText size={16} weight="bold" />} label="Go to Notes" onSelect={() => runCommand(() => onNavigate("notes"))} />
            <NavItem icon={<FolderSimple size={16} weight="bold" />} label="Go to Projects" onSelect={() => runCommand(() => onNavigate("courses"))} />
            <NavItem icon={<ChartLine size={16} weight="bold" />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />
            <NavItem icon={<GearSix size={16} weight="bold" />} label="Settings" onSelect={() => runCommand(() => onNavigate("settings"))} />
          </Command.Group>

          <Command.Group heading="Preferences" className="palette-group">
            <Command.Item onSelect={() => runCommand(onToggleTheme)} className={ITEM_CLASS}>
              <Sun size={16} weight="bold" className="dark:hidden" />
              <Moon size={16} weight="bold" className="hidden dark:inline-block" />
              <span className="palette-item-title">Toggle Theme</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="palette-footer" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
          <span>
            <kbd>N</kbd> New task
          </span>
          <span className="palette-footer-hint-right">
            <kbd>Ctrl</kbd>
            <kbd>K</kbd> anywhere
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function groupResults(results: GlobalSearchResult[]) {
  const grouped = new Map<string, GlobalSearchResult[]>();
  for (const result of results) {
    const heading = result.groupLabel ?? "Search results";
    grouped.set(heading, [...(grouped.get(heading) ?? []), result]);
  }
  return Array.from(grouped.entries());
}

