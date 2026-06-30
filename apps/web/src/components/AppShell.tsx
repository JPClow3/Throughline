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
  Plus,
  DotsThreeCircle
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ThroughlineMark } from "./ThroughlineMark";

export type AppView = "dashboard" | "goals" | "kanban" | "timeline" | "notes" | "courses" | "insights" | "settings";
export type ShellAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  mobileOnly?: boolean;
};

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
  onOpenCommandPalette,
  primaryAction,
  utilityActions = [],
  children
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onNewTask?: (date?: Date) => void;
  onOpenCommandPalette?: () => void;
  primaryAction?: ShellAction;
  utilityActions?: ShellAction[];
  children: ReactNode;
}) {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobilePrimaryItems = navItems.slice(0, 4);
  const mobileMoreItems = [...navItems.slice(4), { view: "settings" as AppView, label: "Settings", icon: <Settings size={22} /> }];

  function navigate(view: AppView) {
    setMobileMoreOpen(false);
    onViewChange(view);
  }

  return (
    <div className="flex h-screen w-full relative">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="shell-sidebar hidden lg:flex fixed left-6 top-6 bottom-6 w-56 rounded-xl bg-[var(--chrome-bg)] border-[var(--glass-border)] shadow-sm flex-col py-base px-3 z-50" style={{ backdropFilter: 'var(--chrome-blur)', WebkitBackdropFilter: 'var(--chrome-blur)' }}>
        <div className="shell-brand">
          <span className="shell-brand-mark">
            <ThroughlineMark size={22} />
          </span>
          <span className="shell-brand-text">Throughline</span>
        </div>

        <div className="flex-1 flex flex-col gap-2 w-full">
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
                    navigate(item.view);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={`shell-nav-link h-11 rounded-lg flex items-center gap-3 px-3 transition-all duration-200 group relative
                  ${isActive
                    ? "text-primary bg-[var(--accent-soft)] shadow-sm"
                    : "text-on-surface-variant interactive-scale hover:bg-[var(--accent-soft)]"}`}
              >
                <span className="shell-nav-icon">{item.icon}</span>
                <span className="shell-nav-label font-label-md text-label-md">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-full"></div>
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
              navigate("settings");
            }
          }}
          aria-current={view === "settings" ? "page" : undefined}
          className={`shell-nav-link h-11 rounded-lg flex items-center gap-3 px-3 mt-auto transition-all duration-200 group
            ${view === "settings"
              ? "text-primary bg-[var(--accent-soft)]"
              : "text-on-surface-variant interactive-scale hover:bg-[var(--accent-soft)]"}`}
        >
          <span className="shell-nav-icon"><Settings size={24} /></span>
          <span className="shell-nav-label font-label-md text-label-md">Settings</span>
        </a>
      </nav>

      <main id="main-content" className="flex-1 ml-0 lg:ml-[280px] h-full flex flex-col pt-4 lg:pt-6 px-4 lg:pl-8 lg:pr-8 pb-40 lg:pb-6 overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="flex lg:hidden justify-between items-center w-full h-12 mb-6 flex-shrink-0">
          <span className="mobile-brand">Throughline</span>
          <div className="flex items-center gap-3">
            <button type="button" className="shell-icon-button text-on-surface-variant hover:bg-[var(--accent-soft)] rounded-full p-2 transition-all" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="shell-avatar w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm border-2 border-white" style={{ background: 'var(--tl-gradient-thread)' }}>
              A
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex justify-between items-center w-full h-16 mb-8 flex-shrink-0">
          <div className="flex items-center gap-gutter">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="shell-search-trigger relative bg-[var(--surface-2)] rounded-full flex items-center px-4 py-2 shadow-sm border border-[var(--border)] text-left"
              aria-label="Open global search"
            >
              <span className="shell-search-icon"><MagnifyingGlass size={18} /></span>
              <span className="text-body-md text-on-surface-variant w-56">Search tasks, notes, goals...</span>
              <kbd className="ml-3 hidden lg:inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                Ctrl K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-gutter">
            {utilityActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`shell-quiet-action${action.mobileOnly ? " hidden lg:inline-flex" : ""}`}
                onClick={action.onClick}
                aria-label={action.label}
              >
                <span className="shell-inline-icon">{action.icon}</span>
                <span className="font-label-md text-label-md hidden lg:inline">{action.label}</span>
              </button>
            ))}
            <button type="button" className="shell-quiet-action" aria-label="View sync status">
              <span className="shell-inline-icon"><ArrowsClockwise size={18} /></span>
              <span className="font-label-md text-label-md hidden lg:inline">Sync Status</span>
            </button>
            <div className="flex items-center gap-4">
              <button type="button" className="shell-icon-button" aria-label="Notifications">
                <Bell size={20} />
              </button>
            </div>
            <button onClick={() => onNewTask?.()} className="shell-primary-action">
              <Plus size={16} weight="bold" />
              New Task
            </button>
            <div className="shell-avatar w-10 h-10 rounded-full ml-2 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white" style={{ background: 'var(--tl-gradient-thread)' }}>
              A
            </div>
          </div>
        </nav>
        {children}

        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="shell-mobile-primary-action lg:hidden"
            aria-label={primaryAction.label}
          >
            <span aria-hidden="true">{primaryAction.icon}</span>
          </button>
        ) : null}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[var(--chrome-bg)] border-t border-[var(--glass-border)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex justify-around items-center px-2 pb-safe z-50" style={{ backdropFilter: 'var(--chrome-blur)', WebkitBackdropFilter: 'var(--chrome-blur)' }}>
          {mobilePrimaryItems.map((item) => {
            const isActive = view === item.view;
            return (
              <a
                key={item.view}
                href={`/app?view=${item.view}`}
                onClick={(e) => {
                  if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    e.preventDefault();
                    navigate(item.view);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={`shell-mobile-nav-link flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all
                  ${isActive 
                    ? "text-primary bg-[var(--accent-soft)]" 
                    : "text-on-surface-variant"}`}
                title={item.label}
                aria-label={item.label}
              >
                <span className="shell-mobile-nav-icon">{item.icon}</span>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen((open) => !open)}
            className={`shell-mobile-nav-link flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
              mobileMoreOpen || mobileMoreItems.some((item) => item.view === view)
                ? "text-primary bg-[var(--accent-soft)]"
                : "text-on-surface-variant"
            }`}
            aria-label="More"
            aria-expanded={mobileMoreOpen}
          >
            <span className="shell-mobile-nav-icon"><DotsThreeCircle size={24} /></span>
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </nav>
        {mobileMoreOpen ? (
          <div className="lg:hidden fixed bottom-24 left-4 right-4 z-50 rounded-xl bg-[var(--chrome-bg)] border border-[var(--glass-border)] shadow-lg p-2 grid grid-cols-2 gap-2" style={{ backdropFilter: 'var(--chrome-blur)', WebkitBackdropFilter: 'var(--chrome-blur)' }}>
            {mobileMoreItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                className={`shell-more-link h-12 rounded-lg flex items-center gap-2 px-3 text-left ${view === item.view ? "text-primary bg-[var(--accent-soft)]" : "text-on-surface-variant"}`}
              >
                <span className="shell-nav-icon">{item.icon}</span>
                <span className="font-label-md text-label-md">{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
