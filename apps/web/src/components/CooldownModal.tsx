import { Task } from "@throughline/domain";
import { X, BatteryCharging } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { TaskCard } from "./TaskCard";

type CooldownModalProps = {
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onStartFocus: (task: Task) => void;
};

export function CooldownModal({
  tasks,
  onClose,
  onEditTask,
  onCompleteTask,
  onStartFocus
}: CooldownModalProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.38)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="clay-panel w-full max-w-lg p-6 rounded-3xl relative flex flex-col gap-5 max-h-[85vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-on-surface/50 hover:text-on-surface hover:bg-accent-soft transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center px-4 pt-4">
          <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-3">
            <BatteryCharging size={24} weight="duotone" />
          </div>
          <h2 className="text-xl font-semibold mb-1">Session Complete!</h2>
          <p className="text-sm text-on-surface/70">
            Great focus. If you're looking for a quick win to cool down, here are some low-energy tasks from your backlog.
          </p>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pb-2 custom-scrollbar">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              onEdit={onEditTask}
              onComplete={onCompleteTask}
              onStartFocus={onStartFocus}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
