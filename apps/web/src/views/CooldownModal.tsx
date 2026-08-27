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
        className="cooldown-body"
      >
        <ModalCloseButton onClose={onClose} />

        <div className="cooldown-hero">
          <div className="cooldown-badge" aria-hidden="true">
            <BatteryCharging size={22} weight="bold" />
          </div>
          <h2>Session Complete!</h2>
          <p>
            Great focus. If you're looking for a quick win to cool down, here are some low-energy tasks from your backlog.
          </p>
        </div>

        <div className="cooldown-task-list custom-scrollbar">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} compact onEdit={onEditTask} onComplete={onCompleteTask} onStartFocus={onStartFocus} />
          ))}
        </div>
      </motion.div>
    </Modal>
  );
}
