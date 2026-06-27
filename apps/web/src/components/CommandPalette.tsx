import { Command } from "cmdk";
import { useEffect } from "react";
import { AppView } from "./AppShell";
import { House, Target, Kanban, CalendarDots, Note, FolderSimple, GearSix, Plus, Moon, Sun } from "@phosphor-icons/react";

type CommandPaletteProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onNewTask: () => void;
  onToggleTheme: () => void;
};

export function CommandPalette({ open, setOpen, onNavigate, onNewTask, onToggleTheme }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[4px] p-4 sm:p-0"
    >
      <div className="w-full max-w-[600px] overflow-hidden rounded-2xl glass-panel shadow-[0px_12px_40px_rgba(0,0,0,0.1)] border-white/20 transform-gpu animate-in fade-in zoom-in-95 duration-200">
        <Command.Input 
          placeholder="Type a command or search..." 
          className="w-full border-none bg-transparent px-5 py-4 text-headline-sm text-on-surface focus:ring-0 placeholder:text-outline-variant outline-none"
        />
        
        <div className="h-[1px] w-full bg-outline-variant/30" />
        
        <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
          <Command.Empty className="py-6 text-center text-body-md text-on-surface-variant">
            No results found.
          </Command.Empty>

          <Command.Group heading="Actions" className="px-2 py-3 text-label-sm font-medium text-on-surface-variant [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-outline">
            <Command.Item 
              onSelect={() => runCommand(onNewTask)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-primary aria-selected:text-on-primary group transition-colors"
            >
              <Plus size={18} className="text-on-surface-variant group-aria-selected:text-on-primary" />
              <span>Create new task</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Navigation" className="px-2 py-3 text-label-sm font-medium text-on-surface-variant [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-outline">
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("dashboard"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <House size={18} className="text-on-surface-variant" />
              <span>Go to Today</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("goals"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <Target size={18} className="text-on-surface-variant" />
              <span>Go to Goals</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("kanban"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <Kanban size={18} className="text-on-surface-variant" />
              <span>Go to Board</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("timeline"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <CalendarDots size={18} className="text-on-surface-variant" />
              <span>Go to Timeline</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("notes"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <Note size={18} className="text-on-surface-variant" />
              <span>Go to Notes</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("courses"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <FolderSimple size={18} className="text-on-surface-variant" />
              <span>Go to Projects</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onNavigate("settings"))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <GearSix size={18} className="text-on-surface-variant" />
              <span>Settings</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Preferences" className="px-2 py-3 text-label-sm font-medium text-on-surface-variant [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-outline">
            <Command.Item 
              onSelect={() => runCommand(onToggleTheme)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-body-md text-on-surface cursor-pointer aria-selected:bg-[var(--accent-soft)] group transition-colors"
            >
              <Sun size={18} className="text-on-surface-variant dark:hidden" />
              <Moon size={18} className="hidden dark:block text-on-surface-variant" />
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
