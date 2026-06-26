import {
  CalendarDots as CalendarDays,
  Kanban as Columns3,
  Note as FileText,
  FolderSimple as FolderClosed,
  House as Home,
  GearSix as Settings,
  Target,
  MagnifyingGlass,
  ArrowsClockwise,
  Bell,
  Plus
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type AppView = "dashboard" | "goals" | "kanban" | "timeline" | "notes" | "courses" | "insights" | "settings";

const navItems: Array<{ view: AppView; label: string; icon: ReactNode }> = [
  { view: "dashboard", label: "Today", icon: <Home size={24} weight="fill" /> },
  { view: "goals", label: "Goals", icon: <Target size={24} /> },
  { view: "kanban", label: "Board", icon: <Columns3 size={24} /> },
  { view: "timeline", label: "Timeline", icon: <CalendarDays size={24} /> },
  { view: "notes", label: "Notes", icon: <FileText size={24} /> },
  { view: "courses", label: "Projects", icon: <FolderClosed size={24} /> },
  { view: "insights", label: "Insights", icon: <Target size={24} /> }
];

export function AppShell({
  view,
  onViewChange,
  onNewTask,
  children
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onNewTask?: (date?: Date) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full relative">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="fixed left-6 top-6 bottom-6 w-20 rounded-xl bg-white/60 dark:bg-black/60 backdrop-blur-[40px] border border-white/20 dark:border-white/10 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center py-base space-y-gutter z-50">
        <div className="w-12 h-12 mb-4 flex flex-col items-center justify-center">
          <div className="font-display-lg text-display-lg font-light text-primary dark:text-primary-fixed-dim">T</div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4 w-full">
          {navItems.map((item) => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                aria-label={item.label}
                title={item.label}
                onClick={() => onViewChange(item.view)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 group relative
                  ${isActive 
                    ? "text-primary dark:text-primary-fixed-dim scale-110 bg-white/20 shadow-sm" 
                    : "text-on-surface-variant/50 dark:text-surface-variant/50 hover:scale-[1.015] hover:bg-white/20 active:scale-[0.98]"}`}
              >
                {item.icon}
                <span className="sr-only">{item.label}</span>
                {isActive && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary dark:bg-primary-fixed-dim rounded-l-full"></div>
                )}
              </button>
            );
          })}
        </div>

        <button
          aria-label="Settings"
          title="Settings"
          onClick={() => onViewChange("settings")}
          className={`w-12 h-12 rounded-lg flex items-center justify-center mt-auto transition-all duration-200 group
            ${view === "settings" 
              ? "text-primary dark:text-primary-fixed-dim scale-110 bg-white/20" 
              : "text-on-surface-variant/50 dark:text-surface-variant/50 hover:scale-[1.015] hover:bg-white/20 active:scale-[0.98]"}`}
        >
          <Settings size={24} />
          <span className="sr-only">Settings</span>
        </button>
      </nav>

      <main id="main-content" className="flex-1 ml-0 md:ml-[112px] h-full flex flex-col pt-6 pr-6 pb-6 overflow-y-auto">
        <nav className="hidden md:flex justify-between items-center w-full h-16 bg-white/60 dark:bg-black/60 backdrop-blur-[40px] border border-white/20 dark:border-white/10 shadow-sm rounded-xl px-padding-glass mb-8 flex-shrink-0">
          <div className="flex items-center gap-gutter">
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Throughline</span>
            <div className="relative glass-panel rounded-full flex items-center px-4 py-2 border-white/20">
              <MagnifyingGlass size={18} className="text-outline mr-2" />
              <input className="bg-transparent border-none focus:ring-0 text-body-md text-on-surface w-48 placeholder-outline-variant p-0" placeholder="Search..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-gutter">
            <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
              <ArrowsClockwise size={18} />
              <span className="font-label-md text-label-md hidden lg:inline">Sync Status</span>
            </button>
            <div className="flex items-center gap-4">
              <button className="text-on-surface-variant hover:bg-white/20 rounded-full p-2 transition-all">
                <Bell size={20} />
              </button>
            </div>
            <button onClick={() => onNewTask?.()} className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg hover:scale-[1.015] active:scale-[0.98] transition-all shadow-md flex items-center gap-2">
              <Plus size={16} weight="bold" />
              New Task
            </button>
          </div>
        </nav>
        {children}

        {/* Mobile FAB for New Task */}
        <button
          onClick={() => onNewTask?.()}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-[1.015] active:scale-[0.98] transition-all z-50"
          aria-label="New task"
        >
          <Plus size={24} weight="bold" />
        </button>
      </main>
    </div>
  );
}
