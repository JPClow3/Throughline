import { Task } from "@throughline/domain";
import { CheckCircle, Pause, Play, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { FocusSessionInput } from "../data/repositories";

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;

type FocusTimerProps = {
  task?: Task | null;
  onTaskClose?: () => void;
  onRecordFocusSession?: (input: FocusSessionInput) => Promise<unknown>;
  launcherMode?: "hidden" | "desktop-dock";
};

export function FocusTimer({
  task = null,
  onTaskClose,
  onRecordFocusSession = async () => undefined,
  launcherMode = "hidden"
}: FocusTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const totalSeconds = Math.max(60, (task?.estimatedMinutes ?? FOCUS_MINUTES) * 60);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(totalSeconds);
    setStartedAt(new Date().toISOString());
  }, [totalSeconds]);

  const finishSession = useCallback(
    (durationSeconds: number) => {
      setIsActive(false);
      setShowSuccess(true);
      void onRecordFocusSession({
        title: task?.title ?? "Focus Session",
        taskId: task?.id,
        courseId: task?.courseId,
        goalId: task?.goalId,
        startedAt,
        endedAt: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(durationSeconds / 60))
      });
      window.setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        setTimeLeft(totalSeconds);
        onTaskClose?.();
      }, 3000);
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

  const toggleTimer = () => {
    if (!isActive && timeLeft === totalSeconds) {
      setStartedAt(new Date().toISOString());
    }
    setIsActive(!isActive);
  };

  const closeTimer = () => {
    setIsOpen(false);
    resetTimer();
    setShowSuccess(false);
    onTaskClose?.();
  };

  const openUntitledFocus = () => {
    setIsOpen(true);
    setIsActive(true);
    setShowSuccess(false);
    setStartedAt(new Date().toISOString());
    setTimeLeft(FOCUS_SECONDS);
  };

  const logCurrentSession = () => {
    const elapsedSeconds = Math.max(60, totalSeconds - timeLeft);
    finishSession(elapsedSeconds);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  if (!isOpen && launcherMode === "hidden") {
    return null;
  }

  return (
    <div className={`focus-timer-shell${isOpen ? " is-open" : ""}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-surface/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[220px] max-w-[min(320px,calc(100vw-2rem))]"
            style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }}
          >
            <div className="w-full flex justify-between items-center px-1 gap-3">
              <span className="text-sm font-medium text-on-surface/70 truncate">
                {task ? `Focus: ${task.title}` : "Focus Session"}
              </span>
              <button
                onClick={closeTimer}
                className="text-on-surface/50 hover:text-on-surface transition-colors"
                aria-label="Close focus timer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" aria-hidden="true">
                <circle cx="64" cy="64" r="60" className="stroke-on-surface/10 fill-none" strokeWidth="4" />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="60"
                  className="stroke-primary fill-none"
                  strokeWidth="4"
                  strokeDasharray="377"
                  strokeDashoffset={377 - (377 * progress) / 100}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 377 }}
                  animate={{ strokeDashoffset: 377 - (377 * progress) / 100 }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>

              {showSuccess ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary flex flex-col items-center">
                  <CheckCircle size={32} weight="fill" />
                  <span className="text-xs font-bold mt-1">Logged</span>
                </motion.div>
              ) : (
                <span className="text-3xl font-light tabular-nums text-on-surface" aria-live="polite">
                  {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </span>
              )}
            </div>

            {!showSuccess && (
              <div className="flex gap-2">
                <button
                  onClick={toggleTimer}
                  className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20"
                  aria-label={isActive ? "Pause focus session" : "Start focus session"}
                >
                  {isActive ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                </button>
                <button
                  type="button"
                  onClick={logCurrentSession}
                  className="secondary-button"
                  aria-label="Log focus session"
                >
                  Log
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && launcherMode === "desktop-dock" ? (
        <button
          type="button"
          className="focus-dock-button"
          onClick={openUntitledFocus}
          aria-label="Start focus session"
        >
          <Play size={18} weight="fill" />
          <span className="font-label-md text-label-md">Focus</span>
        </button>
      ) : null}

    </div>
  );
}
