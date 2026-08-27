import { Warning } from "@phosphor-icons/react";
import { Button, Modal } from "../ui";
import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open || busy) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onConfirm]);

  if (!open) {
    return null;
  }

  return (
    <Modal title={title} onClose={busy ? undefined : onCancel}>
      <div className="confirm-dialog">
        <div className="confirm-icon" aria-hidden="true">
          <Warning size={22} weight="bold" />
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <Button onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
