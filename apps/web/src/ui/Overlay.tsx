import { X } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useDialogA11y } from "./dialogA11y";

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  return (
    <motion.div
      className="sheet-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        ref={panelRef}
        className="sheet"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-toggle" type="button" aria-label="Close" onClick={onClose}>
            <X size={16} weight="bold" />
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  );
}

type ModalProps = {
  title: string;
  onClose?: () => void;
  children: ReactNode;
};

export function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, onClose ?? (() => undefined), panelRef);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="modal-panel ik-card"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="icon-toggle modal-close-btn" aria-label="Close" onClick={onClose}>
      <X size={16} weight="bold" />
    </button>
  );
}
