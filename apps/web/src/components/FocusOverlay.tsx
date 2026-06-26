import { Task } from "@throughline/domain";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Pause } from "@phosphor-icons/react";

export function FocusOverlay({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(task.estimatedMinutes * 60);
      setIsActive(true);
    }
  }, [task]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  if (!task) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(60px)",
          WebkitBackdropFilter: "blur(60px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink)"
        }}
        className="dark:bg-black/50"
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "2rem",
            right: "2rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: "3rem",
            height: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ink)"
          }}
        >
          <X size={24} />
        </button>

        <h2 style={{ fontSize: "var(--text-headline-md)", marginBottom: "1rem", fontWeight: "var(--fw-medium)", color: "var(--ink-muted)" }}>Focusing on</h2>
        <h1 style={{ fontSize: "var(--text-display-lg)", textAlign: "center", maxWidth: "800px", marginBottom: "4rem" }}>
          {task.title}
        </h1>

        <div style={{ fontSize: "8rem", fontWeight: "var(--fw-bold)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.05em", marginBottom: "3rem" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => setIsActive(!isActive)}
            className="primary-button"
            style={{ padding: "1rem 3rem", fontSize: "1.25rem", borderRadius: "2rem", height: "auto" }}
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
            {isActive ? "Pause" : "Resume"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
