import { Task } from "@throughline/domain";
import { BatteryCharging } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button, Modal, ModalCloseButton } from "../ui";
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
          <h2 id="cooldown-title">Easy wins while you cool down</h2>
          <p>
            Great focus. Pick a low-energy backlog task, or close this and take the break.
          </p>
        </div>

        <div className="cooldown-task-list custom-scrollbar" aria-labelledby="cooldown-title">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              compact
              offerEmptyStepInput={false}
              onEdit={onEditTask}
              onComplete={onCompleteTask}
              onStartFocus={onStartFocus}
            />
          ))}
        </div>

        <div className="cooldown-footer">
          <Button variant="primary" onClick={onClose}>
            Done for now
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
