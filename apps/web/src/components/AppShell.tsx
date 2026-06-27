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
      <nav className="hidden md:flex fixed left-6 top-6 bottom-6 w-20 rounded-xl bg-[var(--chrome-bg)] border-[var(--glass-border)] shadow-sm flex-col items-center py-base space-y-gutter z-50" style={{ backdropFilter: 'var(--chrome-blur)', WebkitBackdropFilter: 'var(--chrome-blur)' }}>
        <div className="w-12 h-12 mb-4 mt-2 flex flex-col items-center justify-center">
          <div className="font-display-lg text-display-lg font-light text-primary">T</div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4 w-full">
          {navItems.map((item) => {
            const isActive = view === item.view;
            return (
              <a
                key={item.view}
                href={`/app?view=${item.view}`}
                aria-label={item.label}
                title={item.label}
                onClick={(e) => {
                  if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    e.preventDefault();
                    onViewChange(item.view);
                  }
                }}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 group relative
                  ${isActive 
                    ? "text-primary scale-110 bg-[var(--accent-soft)] shadow-sm" 
                    : "text-on-surface-variant interactive-scale hover:bg-[var(--accent-soft)]"}`}
              >
                {item.icon}
                <span className="sr-only">{item.label}</span>
                {isActive && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"></div>
                )}
              </a>
            );
          })}
        </div>

        <a
          href="/app?view=settings"
          aria-label="Settings"
          title="Settings"
          onClick={(e) => {
            if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              onViewChange("settings");
            }
          }}
          className={`w-12 h-12 rounded-lg flex items-center justify-center mt-auto transition-all duration-200 group
            ${view === "settings" 
              ? "text-primary scale-110 bg-[var(--accent-soft)]" 
              : "text-on-surface-variant interactive-scale hover:bg-[var(--accent-soft)]"}`}
        >
          <Settings size={24} />
          <span className="sr-only">Settings</span>
        </a>
      </nav>

      <main id="main-content" className="flex-1 ml-0 md:ml-[112px] h-full flex flex-col pt-4 md:pt-6 px-4 md:pl-0 md:pr-6 pb-24 md:pb-6 overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="flex md:hidden justify-between items-center w-full h-12 mb-6 flex-shrink-0">
          <span className="font-headline-md text-headline-md font-bold text-primary">Throughline</span>
          <div className="flex items-center gap-3">
            <button className="text-on-surface-variant hover:bg-[var(--accent-soft)] rounded-full p-2 transition-all">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white" style={{ background: 'var(--tl-gradient-thread)' }}>
              A
            </div>
          </div>
        </div>

        <nav className="hidden md:flex justify-between items-center w-full h-16 mb-8 flex-shrink-0">
          <div className="flex items-center gap-gutter">
            <span className="font-headline-md text-headline-md font-bold text-primary">Throughline</span>
            <div className="relative bg-[var(--surface-2)] rounded-full flex items-center px-4 py-2 shadow-sm border border-[var(--border)]">
              <MagnifyingGlass size={18} className="text-outline mr-2" />
              <input className="bg-transparent border-none focus:ring-0 text-body-md text-on-surface w-48 placeholder-outline-variant p-0 outline-none" placeholder="Search..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-gutter">
            <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
              <ArrowsClockwise size={18} />
              <span className="font-label-md text-label-md hidden lg:inline">Sync Status</span>
            </button>
            <div className="flex items-center gap-4">
              <button className="text-on-surface-variant hover:bg-[var(--accent-soft)] rounded-full p-2 transition-all">
                <Bell size={20} />
              </button>
            </div>
            <button onClick={() => onNewTask?.()} className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg interactive-scale shadow-md flex items-center gap-2">
              <Plus size={16} weight="bold" />
              New Task
            </button>
            <div className="w-10 h-10 rounded-full ml-2 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white" style={{ background: 'var(--tl-gradient-thread)' }}>
              A
            </div>
          </div>
        </nav>
        {children}

        {/* Mobile FAB for New Task */}
        <button
          onClick={() => onNewTask?.()}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center interactive-scale z-50"
          aria-label="New task"
        >
          <Plus size={24} weight="bold" />
        </button>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[var(--chrome-bg)] border-t border-[var(--glass-border)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex justify-around items-center px-2 pb-safe z-50" style={{ backdropFilter: 'var(--chrome-blur)', WebkitBackdropFilter: 'var(--chrome-blur)' }}>
          {navItems.slice(0, 5).map((item) => {
            const isActive = view === item.view;
            return (
              <a
                key={item.view}
                href={`/app?view=${item.view}`}
                onClick={(e) => {
                  if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    e.preventDefault();
                    onViewChange(item.view);
                  }
                }}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all
                  ${isActive 
                    ? "text-primary bg-[var(--accent-soft)]" 
                    : "text-on-surface-variant"}`}
                title={item.label}
                aria-label={item.label}
              >
                {item.icon}
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
