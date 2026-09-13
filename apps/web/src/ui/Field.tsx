import type { ComponentPropsWithRef, ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...rest }: ComponentPropsWithRef<"input">) {
  return <input className={`input ${className}`.trim()} {...rest} />;
}

export function TextArea({ className = "", ...rest }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={`input ${className}`.trim()} {...rest} />;
}

export function Select({ className = "", children, ...rest }: ComponentPropsWithRef<"select">) {
  return (
    <select className={`input ${className}`.trim()} {...rest}>
      {children}
    </select>
  );
}

export function ToggleRow({
  checked,
  onChange,
  children
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="toggle-row">
      <input type="checkbox" className="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
