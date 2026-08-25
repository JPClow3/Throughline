import { Task } from "@throughline/domain";
import { BatteryCharging } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Modal, ModalCloseButton } from "../ui";
import { TaskCard } from "./TaskCard";

export function CooldownModal({
  tasks,
  onClose,
  onEditTask,
  onCompleteTask,
  onStartFocus
}: {
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  onStartFocus: (task: Task) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <Modal title="Session complete" onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col gap-5 p-6"
      >
        <ModalCloseButton onClose={onClose} />

        <div className="flex flex-col items-center px-4 pt-3 text-center">
          <div
            className="mb-3 grid h-12 w-12 place-items-center rounded-xl border-2 border-[var(--line)]"
            style={{ background: "var(--green-soft)", boxShadow: "2px 2px 0 0 var(--shadow-ink)" }}
          >
            <BatteryCharging size={22} weight="bold" />
          </div>
          <h2 className="text-lg font-bold">Session Complete!</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Great focus. If you're looking for a quick win to cool down, here are some low-energy tasks from your backlog.
          </p>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto pb-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} compact onEdit={onEditTask} onComplete={onCompleteTask} onStartFocus={onStartFocus} />
          ))}
        </div>
      </motion.div>
    </Modal>
  );
}
