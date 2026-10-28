import { Task } from "@throughline/domain";
import { CheckCircle, Pause, Play, WarningCircle, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusSessionInput } from "../data/repositories";
import { reportError } from "../sentry";
import { Button, IconButton, useDialogA11y } from "../ui";

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;

export function FocusTimer({
  task = null,
  onTaskClose,
  onRecordFocusSession = async () => undefined,
  launcherMode = "hidden"
}: {
  task?: Task | null;
  onTaskClose?: () => void;
  onRecordFocusSession?: (input: FocusSessionInput) => Promise<unknown>;
  launcherMode?: "hidden" | "desktop-dock";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const panelRef = useRef<HTMLDivElement>(null);
  const previousTitleRef = useRef<string | null>(null);
  const closeRequestRef = useRef<() => void>(() => undefined);
  const totalSeconds = Math.max(60, (task?.estimatedMinutes ?? FOCUS_MINUTES) * 60);

  useDialogA11y(isOpen, () => closeRequestRef.current(), panelRef);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(totalSeconds);
    setStartedAt(new Date().toISOString());
  }, [totalSeconds]);

  const finishSession = useCallback(
    (durationSeconds: number) => {
      setIsActive(false);
      setSaveError(false);
      void (async () => {
        try {
          await onRecordFocusSession({
            title: task?.title ?? "Focus Session",
            taskId: task?.id,
            courseId: task?.courseId,
            goalId: task?.goalId,
            startedAt,
            endedAt: new Date().toISOString(),
            durationMinutes: Math.max(1, Math.round(durationSeconds / 60))
          });
          setShowSuccess(true);
        } catch (error) {
          reportError(error, { source: "focus-save" });
          setSaveError(true);
          return;
        }
        window.setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
          setTimeLeft(totalSeconds);
          onTaskClose?.();
        }, 3000);
      })();
    },
    [onRecordFocusSession, onTaskClose, startedAt, task, totalSeconds]
  );

  useEffect(() => {
    if (!task) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsOpen(true);
      setIsActive(true);
      setShowSuccess(false);
      setSaveError(false);
      setStartedAt(new Date().toISOString());
      setTimeLeft(totalSeconds);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [task, totalSeconds]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            finishSession(totalSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [finishSession, isActive, timeLeft, totalSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const clockLabel = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (!isOpen) {
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
        previousTitleRef.current = null;
      }
      return;
    }
    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title;
    }
    const label = task?.title ? `Focus · ${task.title}` : "Focus session";
    document.title = showSuccess ? `Logged · ${label}` : `${clockLabel} · ${label}`;
    return () => {
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
        previousTitleRef.current = null;
      }
    };
  }, [clockLabel, isOpen, showSuccess, task?.title]);

  const toggleTimer = () => {
    if (!isActive && timeLeft === totalSeconds) {
      setStartedAt(new Date().toISOString());
    }
    setIsActive(!isActive);
  };

  const closeTimer = useCallback(() => {
    // Never throw away real work: closing mid-session logs the elapsed time
    // as a focus record (minimum one minute) instead of discarding it.
    const elapsedSeconds = totalSeconds - timeLeft;
    if (!showSuccess && isActive && elapsedSeconds >= 60) {
      setIsActive(false);
      finishSession(elapsedSeconds);
      return;
    }
    setIsOpen(false);
    resetTimer();
    setShowSuccess(false);
    setSaveError(false);
    onTaskClose?.();
  }, [finishSession, isActive, onTaskClose, resetTimer, showSuccess, timeLeft, totalSeconds]);

  useEffect(() => {
    closeRequestRef.current = closeTimer;
  }, [closeTimer]);

  const openUntitledFocus = () => {
    setIsOpen(true);
    setIsActive(true);
    setShowSuccess(false);
    setSaveError(false);
    setStartedAt(new Date().toISOString());
    setTimeLeft(FOCUS_SECONDS);
  };

  const logCurrentSession = () => {
    const elapsedSeconds = Math.max(60, totalSeconds - timeLeft);
    finishSession(elapsedSeconds);
  };

  if (!isOpen && launcherMode === "hidden") {
    return null;
  }

  return (
    <div className="focus-timer-shell">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="ik-card focus-timer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-timer-title"
            tabIndex={-1}
          >
            <div className="focus-timer-head">
              <span id="focus-timer-title" className="truncate">
                {task ? `Focus: ${task.title}` : "Focus Session"}
              </span>
              <IconButton label="Close focus timer" size="sm" onClick={closeTimer}>
                <X size={13} weight="bold" />
              </IconButton>
            </div>

            <div
              className="focus-ring"
              style={{ "--progress": progress } as React.CSSProperties}
              role="timer"
              aria-label={showSuccess ? "Focus session logged" : saveError ? "Could not log focus session" : `Time remaining ${clockLabel}`}
              aria-live="off"
            >
              {showSuccess ? (
                <span className="focus-timer-success">
                  <CheckCircle size={30} weight="bold" />
                  <strong>Logged</strong>
                </span>
              ) : saveError ? (
                <span className="focus-timer-success" role="alert">
                  <WarningCircle size={30} weight="bold" />
                  <strong>Couldn't log — try again</strong>
                </span>
              ) : (
                <span className="focus-ring-time tabular">{clockLabel}</span>
              )}
            </div>
            <span className="sr-only" aria-live="polite">
              {isActive
                ? timeLeft > 0 && timeLeft % 60 === 0
                  ? `${minutes} minutes remaining`
                  : ""
                : showSuccess
                  ? "Focus session logged"
                  : "Focus session paused"}
            </span>

            {!showSuccess ? (
              <div className="focus-timer-actions">
                <Button
                  variant="primary"
                  className="focus-timer-toggle"
                  aria-label={isActive ? "Pause focus session" : "Start focus session"}
                  onClick={toggleTimer}
                >
                  {isActive ? <Pause size={18} weight="bold" /> : <Play size={18} weight="bold" />}
                </Button>
                <Button aria-label="Log focus session" onClick={logCurrentSession}>
                  Log
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isOpen && launcherMode === "desktop-dock" ? (
        <button type="button" className="focus-dock-button" onClick={openUntitledFocus} aria-label="Start focus session">
          <Play size={17} weight="bold" />
          <span>Focus</span>
        </button>
      ) : null}
    </div>
  );
}
