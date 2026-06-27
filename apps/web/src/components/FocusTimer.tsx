import { Play, Pause, X, CheckCircle, Timer } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;

export function FocusTimer() {
  const { recordFocusSession } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setShowSuccess(true);
            void recordFocusSession(FOCUS_MINUTES);
            setTimeout(() => {
              setShowSuccess(false);
              setIsOpen(false);
              setTimeLeft(FOCUS_SECONDS);
            }, 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, recordFocusSession]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(FOCUS_SECONDS);
  };

  const closeTimer = () => {
    setIsOpen(false);
    resetTimer();
    setShowSuccess(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((FOCUS_SECONDS - timeLeft) / FOCUS_SECONDS) * 100;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-surface/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]"
            style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }}
          >
            <div className="w-full flex justify-between items-center px-1">
              <span className="text-sm font-medium text-on-surface/70">Focus Session</span>
              <button 
                onClick={closeTimer}
                className="text-on-surface/50 hover:text-on-surface transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle 
                  cx="64" cy="64" r="60" 
                  className="stroke-on-surface/10 fill-none" 
                  strokeWidth="4" 
                />
                <motion.circle
                  cx="64" cy="64" r="60"
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-primary flex flex-col items-center"
                >
                  <CheckCircle size={32} weight="fill" />
                  <span className="text-xs font-bold mt-1">+XP</span>
                </motion.div>
              ) : (
                <span className="text-3xl font-light tabular-nums text-on-surface">
                  {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </span>
              )}
            </div>

            {!showSuccess && (
              <div className="flex gap-2">
                <button
                  onClick={toggleTimer}
                  className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20"
                >
                  {isActive ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-surface/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl text-on-surface flex items-center gap-3"
        >
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <Timer size={24} weight="duotone" />
          </div>
          <span className="font-medium pr-2">Start Focus</span>
        </motion.button>
      )}
    </div>
  );
}
