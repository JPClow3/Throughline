import {
  CalendarDots as CalendarDays,
  Kanban as Columns3,
  Note as FileText,
  FolderSimple as FolderClosed,
  House as Home,
  GearSix as Settings,
  Target
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

function ThroughlineMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="5" cy="17" r="2.4" fill="currentColor" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}

export type AppView = "dashboard" | "goals" | "kanban" | "timeline" | "notes" | "courses" | "settings";

const navItems: Array<{ view: AppView; label: string; icon: ReactNode }> = [
  { view: "dashboard", label: "Today", icon: <Home size={18} /> },
  { view: "goals", label: "Goals", icon: <Target size={18} /> },
  { view: "kanban", label: "Board", icon: <Columns3 size={18} /> },
  { view: "timeline", label: "Timeline", icon: <CalendarDays size={18} /> },
  { view: "notes", label: "Notes", icon: <FileText size={18} /> },
  { view: "courses", label: "Projects", icon: <FolderClosed size={18} /> },
  { view: "settings", label: "Settings", icon: <Settings size={18} /> }
];

export function AppShell({
  view,
  onViewChange,
  children
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar glass-panel">
        <a className="brand-mark" href="/app" aria-label="Throughline home" title="Throughline">
          <ThroughlineMark />
        </a>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.view}
              className={view === item.view ? "nav-item active" : "nav-item"}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => onViewChange(item.view)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
