import { useEffect, useId, useLayoutEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"]):not([aria-hidden="true"])',
  'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
].join(", ");

function isFocusable(el: HTMLElement): boolean {
  if (el.getAttribute("tabindex") === "-1" || el.getAttribute("aria-hidden") === "true") {
    return false;
  }
  if ("disabled" in el && (el as HTMLButtonElement | HTMLInputElement).disabled) {
    return false;
  }
  return true;
}

export type DialogStackEntry = {
  id: string;
  panelRef: RefObject<HTMLElement | null>;
};

export const dialogStack: DialogStackEntry[] = [];

function purgeDisconnectedEntries(): void {
  if (typeof document === "undefined") return;
  for (let i = dialogStack.length - 1; i >= 0; i--) {
    const el = dialogStack[i].panelRef.current;
    if (!el || !document.contains(el)) {
      dialogStack.splice(i, 1);
    }
  }
}

export function isTopmostOverlay(dialogId: string, panelRef: RefObject<HTMLElement | null>): boolean {
  if (typeof document !== "undefined") {
    // If CommandPalette is open, it takes precedence (z-[120]) over standard sheets and modals
    const palette = document.querySelector(".palette-backdrop");
    if (palette && !panelRef.current?.closest(".palette-backdrop")) {
      return false;
    }
  }

  purgeDisconnectedEntries();

  if (dialogStack.length === 0) {
    return true;
  }

  // Filter out entries that contain other active dialogs (parents cannot be topmost)
  const candidateStack = dialogStack.filter((entry) => {
    const panel = entry.panelRef.current;
    if (!panel) return false;
    return !dialogStack.some(
      (other) => other.id !== entry.id && other.panelRef.current && panel.contains(other.panelRef.current)
    );
  });

  if (candidateStack.length === 0) {
    return true;
  }

  const topEntry = candidateStack[candidateStack.length - 1];
  return topEntry?.id === dialogId;
}

export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  const dialogId = useId();
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Track active element while dialog is closed
  useEffect(() => {
    if (!open) {
      const handleFocus = () => {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body && (!panelRef.current || !panelRef.current.contains(active))) {
          triggerElementRef.current = active;
        }
      };
      handleFocus();
      document.addEventListener("focusin", handleFocus);
      return () => document.removeEventListener("focusin", handleFocus);
    }
  }, [open, panelRef]);

  // Capture active element if opened before focus listener caught it
  useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body && (!panelRef.current || !panelRef.current.contains(active))) {
        triggerElementRef.current = active;
      }
    }
  }, [open, panelRef]);

  // Initial focus and focus restoration
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!panelRef.current) return;

      const active = document.activeElement;
      // If focus is already inside the panel (e.g. child has autoFocus), do not steal it
      if (active && panelRef.current.contains(active) && active !== panelRef.current) {
        return;
      }

      // If an element explicitly requests autofocus, prioritize it
      const autofocusEl = panelRef.current.querySelector<HTMLElement>("[autofocus], [data-autofocus]");
      if (autofocusEl && isFocusable(autofocusEl)) {
        autofocusEl.focus();
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isFocusable);

      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!panelRef.current.hasAttribute("tabindex")) {
          panelRef.current.setAttribute("tabindex", "-1");
        }
        panelRef.current.focus();
      }
    }, 10);

    return () => {
      window.clearTimeout(timeout);
      if (triggerElementRef.current) {
        const toRestore = triggerElementRef.current;
        triggerElementRef.current = null;
        if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
          toRestore.focus();
        }
      }
    };
  }, [open, panelRef]);

  // Overlay stack registration, Tab trapping, and Escape key handling
  useEffect(() => {
    if (!open) {
      return;
    }

    const entry: DialogStackEntry = { id: dialogId, panelRef };
    dialogStack.push(entry);

    const onKey = (event: KeyboardEvent) => {
      // Non-topmost overlays must ignore all keydown interactions (Escape and Tab trapping)
      if (!isTopmostOverlay(dialogId, panelRef)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isFocusable);

      if (focusables.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!panelRef.current.contains(active)) {
        event.preventDefault();
        if (event.shiftKey) {
          last.focus();
        } else {
          first.focus();
        }
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      for (let i = dialogStack.length - 1; i >= 0; i--) {
        if (dialogStack[i].id === dialogId) {
          dialogStack.splice(i, 1);
        }
      }
    };
  }, [open, dialogId, panelRef]);
}
