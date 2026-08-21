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
  ChartLine,
  Plus,
  DotsThreeCircle,
  SignOut,
  ShieldCheck,
  GearSix
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThroughlineMark } from "./ThroughlineMark";
import { APP_LOCALE } from "../lib/format";

export type AppView = "dashboard" | "goals" | "kanban" | "timeline" | "notes" | "courses" | "insights" | "settings";
export type ShellAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  mobileOnly?: boolean;
};

export type ShellSync = {
  status: "idle" | "syncing" | "offline" | "error";
  lastSyncAt: string | null;
  syncNow: () => Promise<void>;
};

const navItems: Array<{ view: AppView; label: string; icon: ReactNode }> = [
  { view: "dashboard", label: "Today", icon: <Home size={24} weight="fill" /> },
  { view: "goals", label: "Goals", icon: <Target size={24} /> },
  { view: "kanban", label: "Board", icon: <Columns3 size={24} /> },
  { view: "timeline", label: "Timeline", icon: <CalendarDays size={24} /> },
  { view: "notes", label: "Notes", icon: <FileText size={24} /> },
  { view: "courses", label: "Projects", icon: <FolderClosed size={24} /> },
  { view: "insights", label: "Insights", icon: <ChartLine size={24} /> }
];

function initialFromEmail(email: string | null): string {
  const source = email?.trim();
  return source ? source[0].toUpperCase() : "?";
}

function relativeSyncTime(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  return new Date(then).toLocaleDateString(APP_LOCALE, { month: "short", day: "numeric" });
}

function syncMeta(status: ShellSync["status"], lastSyncAt: string | null) {
  switch (status) {
    case "syncing":
      return { tone: "is-busy", label: "Syncing…" };
    case "offline":
      return { tone: "is-warn", label: "Offline · saved on this device" };
    case "error":
      return { tone: "is-error", label: "Paused · will retry" };
    default:
      return lastSyncAt
        ? { tone: "is-ok", label: "Up to date" }
        : { tone: "is-ok", label: "Ready to sync" };
  }
}

function useDismissableOpen(active: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, onClose]);

  return containerRef;
}

function AccountMenu({
  email,
  sync,
  onNavigateSettings,
  onSignOut,
  align = "right"
}: {
  email: string | null;
  sync?: ShellSync;
  onNavigateSettings?: () => void;
  onSignOut?: () => void;
  align?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const containerRef = useDismissableOpen(open, close);
  const meta = sync ? syncMeta(sync.status, sync.lastSyncAt) : null;
  const relative = relativeSyncTime(sync?.lastSyncAt ?? null);
  const syncing = sync?.status === "syncing";

  return (
    <div className="shell-account" ref={containerRef}>
      <button
        type="button"
        className="shell-avatar-button clay-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${email ?? "account"}`}
        title={email ?? undefined}
      >
        <span aria-hidden="true">{initialFromEmail(email)}</span>
      </button>
      {open ? (
        <div className={`account-menu clay-modal ${align === "left" ? "align-left" : ""}`} role="menu" aria-label="Account">
          <div className="account-menu-header">
            <span className="shell-avatar account-menu-avatar" style={{ background: "var(--tl-gradient-thread)" }} aria-hidden="true">
              {initialFromEmail(email)}
            </span>
            <div className="account-menu-identity">
              <span className="account-menu-email" title={email ?? undefined}>{email ?? "Signed in"}</span>
              <span className="account-menu-plan">
                <ShieldCheck size={13} weight="fill" />
                End-to-end encrypted
              </span>
            </div>
          </div>

          {sync && meta ? (
            <div className="account-menu-sync">
              <span className={`sync-dot ${meta.tone}`} aria-hidden="true" />
              <span className="account-menu-sync-label">{meta.label}</span>
              {relative ? <span className="account-menu-sync-time">{relative}</span> : null}
            </div>
          ) : null}

          <div className="account-menu-actions" role="none">
            {sync ? (
              <button
                type="button"
                role="menuitem"
                className="account-menu-item"
                onClick={() => {
                  void sync.syncNow();
                }}
                disabled={syncing}
              >
                <ArrowsClockwise size={16} className={syncing ? "spin" : undefined} />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            ) : null}
            {onNavigateSettings ? (
              <button
                type="button"
                role="menuitem"
                className="account-menu-item"
                onClick={() => {
                  close();
                  onNavigateSettings();
                }}
              >
                <GearSix size={16} />
                Settings
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="account-menu-item is-danger"
              onClick={() => {
                close();
                onSignOut?.();
              }}
            >
              <SignOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SyncPill({ sync }: { sync?: ShellSync }) {
  if (!sync) {
    return null;
  }
  const meta = syncMeta(sync.status, sync.lastSyncAt);
  const syncing = sync.status === "syncing";

  return (
    <button
      type="button"
      className="shell-sync-pill clay-btn"
      onClick={() => void sync.syncNow()}
      disabled={syncing}
      title={meta.label + (sync.lastSyncAt ? ` · ${relativeSyncTime(sync.lastSyncAt)}` : "")}
      aria-label={`Sync status: ${meta.label}. Click to sync now`}
    >
      <span className={`sync-dot ${meta.tone}`} aria-hidden="true" />
      <span className="font-label-md text-label-md hidden xl:inline">{meta.label}</span>
    </button>
  );
}

export function AppShell({
  view,
  onViewChange,
  onNewTask,
  onOpenCommandPalette,
  primaryAction,
  utilityActions = [],
  email = null,
  sync,
  onSignOut,
  children
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onNewTask?: (date?: Date) => void;
  onOpenCommandPalette?: () => void;
  primaryAction?: ShellAction;
  utilityActions?: ShellAction[];
  email?: string | null;
  sync?: ShellSync;
  onSignOut?: () => void;
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
    <div className="flex h-screen w-full relative overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className="shell-sidebar hidden lg:flex fixed left-6 top-6 bottom-6 w-60 rounded-3xl clay-panel flex-col py-6 px-4 z-50" >
        <div className="shell-brand">
          <span className="shell-brand-mark">
            <ThroughlineMark size={22} />
          </span>
          <span className="shell-brand-text">Throughline</span>
        </div>

        <div className="flex-1 flex flex-col gap-2 w-full mt-2">
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
                className={`shell-nav-link h-11 rounded-xl flex items-center gap-3 px-3 transition-all duration-200 group relative
                  ${isActive
                    ? "text-primary bg-[var(--accent-soft)] shadow-sm"
                    : "text-on-surface-variant clay-btn hover:bg-[var(--accent-soft)]"}`}
              >
                <span className="shell-nav-icon">{item.icon}</span>
                <span className="shell-nav-label font-label-md text-label-md">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
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
          className={`shell-nav-link h-11 rounded-xl flex items-center gap-3 px-3 mt-auto transition-all duration-200 group
            ${view === "settings"
              ? "text-primary bg-[var(--accent-soft)]"
              : "text-on-surface-variant clay-btn hover:bg-[var(--accent-soft)]"}`}
        >
          <span className="shell-nav-icon"><Settings size={24} /></span>
          <span className="shell-nav-label font-label-md text-label-md">Settings</span>
        </a>
      </nav>

      <main id="main-content" className="flex-1 ml-0 lg:ml-[280px] h-full flex flex-col pt-4 lg:pt-6 px-4 lg:pl-8 lg:pr-8 pb-40 lg:pb-6 overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="flex lg:hidden justify-between items-center w-full h-12 mb-6 flex-shrink-0">
          <span className="mobile-brand">Throughline</span>
          <AccountMenu email={email} sync={sync} onSignOut={onSignOut} align="right" />
        </div>

        <nav className="hidden lg:flex justify-between items-center w-full h-16 mb-8 flex-shrink-0">
          <div className="flex items-center gap-gutter">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="shell-search-trigger clay-btn relative rounded-full flex items-center px-4 py-2 text-left hover:scale-[1.01] transition-transform"
              aria-label="Open global search"
            >
              <span className="shell-search-icon"><MagnifyingGlass size={18} /></span>
              <span className="text-body-md text-on-surface-variant w-64 truncate">Search tasks, notes, goals...</span>
              <kbd className="ml-3 hidden lg:inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                Ctrl K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {utilityActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`shell-quiet-action clay-btn${action.mobileOnly ? " hidden lg:inline-flex" : ""}`}
                onClick={action.onClick}
                aria-label={action.label}
              >
                <span className="shell-inline-icon">{action.icon}</span>
                <span className="font-label-md text-label-md hidden lg:inline">{action.label}</span>
              </button>
            ))}
            <SyncPill sync={sync} />
            <button onClick={() => onNewTask?.()} className="shell-primary-action clay-btn cursor-pointer">
              <Plus size={16} weight="bold" />
              New Task
            </button>
            <AccountMenu email={email} sync={sync} onNavigateSettings={() => navigate("settings")} onSignOut={onSignOut} />
          </div>
        </nav>
        {children}

        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="shell-mobile-primary-action clay-btn lg:hidden shadow-2xl"
            aria-label={primaryAction.label}
          >
            <span aria-hidden="true">{primaryAction.icon}</span>
          </button>
        ) : null}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 clay-panel rounded-t-3xl border-t border-[var(--glass-border)] shadow-2xl flex justify-around items-center px-2 pb-safe z-50" >
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
                className={`shell-mobile-nav-link flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all
                  ${isActive 
                    ? "text-primary bg-[var(--accent-soft)] shadow-sm" 
                    : "text-on-surface-variant clay-btn"}`}
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
            className={`shell-mobile-nav-link flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              mobileMoreOpen || mobileMoreItems.some((item) => item.view === view)
                ? "text-primary bg-[var(--accent-soft)] shadow-sm"
                : "text-on-surface-variant clay-btn"
            }`}
            aria-label="More"
            aria-expanded={mobileMoreOpen}
          >
            <span className="shell-mobile-nav-icon"><DotsThreeCircle size={24} /></span>
            <span className="text-[10px] font-medium mt-1">More</span>
          </button>
        </nav>
        {mobileMoreOpen ? (
          <div className="lg:hidden fixed bottom-24 left-4 right-4 z-50 rounded-2xl clay-panel p-3 grid grid-cols-2 gap-2 shadow-2xl" >
            {mobileMoreItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => navigate(item.view)}
                className={`shell-more-link h-12 rounded-xl flex items-center gap-2 px-3 text-left transition-all ${view === item.view ? "text-primary bg-[var(--accent-soft)] font-semibold" : "text-on-surface-variant clay-btn"}`}
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
