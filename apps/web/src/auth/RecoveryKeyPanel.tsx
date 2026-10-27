import { Check, Copy } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Button, Field, TextInput, ToggleRow } from "../ui";

export function RecoveryKeyPanel({
  recoveryKey,
  confirmed,
  onConfirmedChange,
  partialKey,
  onPartialKeyChange,
  onRegenerate,
  regenerateBusy = false,
  regenerateLabel = "Generate a different key",
  footer
}: {
  recoveryKey: string;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
  partialKey: string;
  onPartialKeyChange: (value: string) => void;
  onRegenerate?: () => void | Promise<void>;
  regenerateBusy?: boolean;
  regenerateLabel?: string;
  footer?: ReactNode;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const expectedPartial = recoveryKey.slice(-4);
  const confirmedComplete = confirmed && partialKey.toLowerCase() === expectedPartial.toLowerCase();

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2400);
    }
  }

  return (
    <div className="recovery-key-panel">
      <div className="recovery-key-display" aria-label="Recovery key">
        {recoveryKey}
      </div>
      <div className="recovery-key-actions">
        <Button type="button" onClick={() => void copyKey()}>
          {copyState === "copied" ? <Check size={15} weight="bold" /> : <Copy size={15} weight="bold" />}
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy key"}
        </Button>
        {onRegenerate ? (
          <Button type="button" onClick={() => void onRegenerate()} disabled={regenerateBusy}>
            {regenerateBusy ? "Generating…" : regenerateLabel}
          </Button>
        ) : null}
      </div>
      <p className="recovery-key-hint">
        Save this in a password manager before continuing. The server cannot read your task content, and Throughline
        cannot recover encrypted data if both your password and recovery key are lost.
      </p>
      <ToggleRow checked={confirmed} onChange={onConfirmedChange}>
        I have saved this recovery key securely
      </ToggleRow>
      <Field label="To confirm, enter the last 4 characters of your key">
        <TextInput
          type="text"
          value={partialKey}
          onChange={(event) => onPartialKeyChange(event.target.value)}
          placeholder="last 4"
          maxLength={4}
          autoComplete="off"
          spellCheck={false}
          className="recovery-key-partial"
          aria-invalid={partialKey.length === 4 && !confirmedComplete ? true : undefined}
        />
      </Field>
      <span className="status-pill self-start" role="status">
        {confirmedComplete ? "Saved confirmation complete" : "Save and confirm before continuing"}
      </span>
      {footer}
    </div>
  );
}

export function isRecoveryKeyConfirmed(recoveryKey: string, confirmed: boolean, partialKey: string) {
  return confirmed && partialKey.toLowerCase() === recoveryKey.slice(-4).toLowerCase();
}
