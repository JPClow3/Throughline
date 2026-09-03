import { ArrowsClockwise, CalendarDots, ChartLine, GearSix, House, Kanban, MagnifyingGlass, Note as FileText, FolderSimple, Plus, SignOut, ShieldCheck, DotsThree, Target } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mark } from "../ui";
import { APP_LOCALE } from "../lib/format";

export type AppView = "dashboard" | "goals" | "kanban" | "timeline" | "notes" | "courses" | "insights" | "settings";

export type ShellSync = {
  status: "idle" | "syncing" | "offline" | "error";
  lastSyncAt: string | null;
  syncNow: () => Promise<void>;
};

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: ReactNode }> = [
  { view: "dashboard", label: "Today", icon: <House size={17} weight="bold" /> },
  { view: "goals", label: "Goals", icon: <Target size={17} weight="bold" /> },
  { view: "kanban", label: "Board", icon: <Kanban size={17} weight="bold" /> },
  { view: "timeline", label: "Timeline", icon: <CalendarDots size={17} weight="bold" /> },
  { view: "notes", label: "Notes", icon: <FileText size={17} weight="bold" /> },
  { view: "courses", label: "Projects", icon: <FolderSimple size={17} weight="bold" /> },
  { view: "insights", label: "Insights", icon: <ChartLine size={17} weight="bold" /> }
];

const MOBILE_PRIMARY_VIEWS: AppView[] = ["dashboard", "kanban", "timeline", "notes"];

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
        ? { tone: "", label: "Up to date" }
        : { tone: "", label: "Ready to sync" };
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
        className="shell-avatar-button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Account menu for ${email ?? "account"}`}
        title={email ?? undefined}
      >
        <span aria-hidden="true">{initialFromEmail(email)}</span>
      </button>
      {open ? (
        <div id="account-menu" className={`account-menu ${align === "left" ? "align-left" : ""}`} role="menu" aria-label="Account">
          <div className="account-menu-header">
            <span className="account-menu-avatar" aria-hidden="true">
              {initialFromEmail(email)}
            </span>
            <div>
              <span className="account-menu-email">{email ?? "Signed in"}</span>
              <span className="account-menu-plan">
                <ShieldCheck size={12} weight="bold" />
                End-to-end encrypted
              </span>
            </div>
          </div>

          {sync && meta ? (
            <div className="account-menu-sync">
              <span className={`sync-dot ${meta.tone}`} aria-hidden="true" />
              <span>{meta.label}</span>
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
                <ArrowsClockwise size={15} weight="bold" className={syncing ? "spin" : undefined} />
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
                <GearSix size={15} weight="bold" />
                Settings
              </button>
            ) : null}
            {onSignOut ? (
              <button
                type="button"
                role="menuitem"
                className="account-menu-item is-danger"
                onClick={() => {
                  close();
                  onSignOut();
                }}
              >
                <SignOut size={15} weight="bold" />
                Sign out
              </button>
            ) : null}
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
      className="shell-sync-pill"
      onClick={() => void sync.syncNow()}
      disabled={syncing}
      title={meta.label + (sync.lastSyncAt ? ` · ${relativeSyncTime(sync.lastSyncAt)}` : "")}
      aria-label={`Sync status: ${meta.label}. Click to sync now`}
    >
      <span className={`sync-dot ${meta.tone}`} aria-hidden="true" />
      <span className="hidden xl:inline">{meta.label}</span>
    </button>
  );
}

export function AppShell({
  view,
  onViewChange,
  onNewTask,
  onOpenCommandPalette,
  primaryActionLabel,
  email = null,
  sync,
  onSignOut,
  children
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onNewTask?: () => void;
  onOpenCommandPalette?: () => void;
  primaryActionLabel?: string;
  email?: string | null;
  sync?: ShellSync;
  onSignOut?: () => void;
  children: ReactNode;
}) {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const mobileMoreToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileMoreSheetRef = useRef<HTMLDivElement | null>(null);

  // Navigating between views reads like opening a page: start at the top.
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [view]);

  useEffect(() => {
    if (!mobileMoreOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (mobileMoreToggleRef.current?.contains(target) || mobileMoreSheetRef.current?.contains(target)) {
        return;
      }
      setMobileMoreOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMoreOpen(false);
        mobileMoreToggleRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMoreOpen]);

  function navigate(next: AppView) {
    setMobileMoreOpen(false);
    onViewChange(next);
  }

  function handleNavClick(event: React.MouseEvent<HTMLAnchorElement>, next: AppView) {
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      navigate(next);
    }
  }

  const mobileMoreItems = NAV_ITEMS.filter(
    (item): item is typeof item & { view: AppView } => !MOBILE_PRIMARY_VIEWS.includes(item.view)
  );

  return (
    <div className="shell-root">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="shell-masthead">
        <a className="shell-brand" href="/app?view=dashboard" onClick={(e) => handleNavClick(e, "dashboard")}>
          <span className="shell-brand-mark">
            <Mark size={18} />
          </span>
          <span>Throughline</span>
        </a>

        {onOpenCommandPalette ? (
          <button type="button" className="shell-search-trigger hidden md:inline-flex" onClick={onOpenCommandPalette} aria-label="Open global search">
            <MagnifyingGlass size={16} weight="bold" />
            <span className="w-52 truncate text-left lg:w-64">Search tasks, notes, goals…</span>
            <kbd className="shell-search-kbd">Ctrl K</kbd>
          </button>
        ) : null}

        <div className="shell-actions">
          {onOpenCommandPalette ? (
            <button
              type="button"
              className="icon-toggle md:hidden"
              onClick={onOpenCommandPalette}
              aria-label="Open global search"
              title="Search"
            >
              <MagnifyingGlass size={16} weight="bold" />
            </button>
          ) : null}
          {onNewTask ? (
            <button
              type="button"
              className="btn btn-accent btn-sm hidden lg:inline-flex"
              onClick={onNewTask}
            >
              <Plus size={15} weight="bold" />
              New Task
            </button>
          ) : null}
          <SyncPill sync={sync} />
          <AccountMenu email={email} sync={sync} onNavigateSettings={() => navigate("settings")} onSignOut={onSignOut} />
        </div>
      </header>

      <nav className="shell-tabs hidden lg:flex" aria-label="Primary">
        {[...NAV_ITEMS, { view: "settings" as AppView, label: "Settings", icon: <GearSix size={16} weight="bold" /> }].map(
          (item) => (
            <a
              key={item.view}
              href={`/app?view=${item.view}`}
              aria-label={item.label}
              title={item.label}
              onClick={(e) => handleNavClick(e, item.view)}
              aria-current={view === item.view ? "page" : undefined}
              className="shell-tab"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          )
        )}
      </nav>

      <main ref={mainRef} id="main-content" className="shell-main">
        <div className="shell-content">
          {children}
        </div>
      </main>

      {primaryActionLabel && onNewTask ? (
        <button
          type="button"
          onClick={onNewTask}
          className="shell-mobile-primary-action"
          aria-label={primaryActionLabel}
        >
          <Plus size={24} weight="bold" />
        </button>
      ) : null}

      <nav className="shell-dock" aria-label="Primary">
        {NAV_ITEMS.filter((item) => MOBILE_PRIMARY_VIEWS.includes(item.view)).map((item) => (
          <a
            key={item.view}
            href={`/app?view=${item.view}`}
            onClick={(e) => handleNavClick(e, item.view)}
            aria-current={view === item.view ? "page" : undefined}
            className={`dock-link${view === item.view ? " active" : ""}`}
            title={item.label}
            aria-label={item.label}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </a>
        ))}
        <button
          type="button"
          ref={mobileMoreToggleRef}
          onClick={() => setMobileMoreOpen((open) => !open)}
          className={`dock-link${mobileMoreOpen || mobileMoreItems.some((item) => item.view === view) ? " active" : ""}`}
          aria-label="More"
          aria-expanded={mobileMoreOpen}
          aria-controls="mobile-more-menu"
        >
          <DotsThree size={20} weight="bold" />
          More
        </button>
      </nav>

      {mobileMoreOpen ? (
        <div id="mobile-more-menu" ref={mobileMoreSheetRef} className="dock-more-sheet" role="menu" aria-label="More views">
          {[...mobileMoreItems, { view: "settings" as AppView, label: "Settings", icon: <GearSix size={18} weight="bold" /> }].map(
            (item) => (
              <button
                key={item.view}
                type="button"
                role="menuitem"
                onClick={() => navigate(item.view)}
                className={`dock-more-link${view === item.view ? " current" : ""}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
