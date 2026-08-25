import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "blue" | "danger" | "quiet";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  children?: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  blue: "btn-blue",
  danger: "btn-danger",
  quiet: ""
};

export function Button({ variant = "quiet", size = "md", className = "", type = "button", ...rest }: ButtonProps) {
  const classes = ["btn", VARIANT_CLASS[variant], size === "sm" ? "btn-sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={classes} {...rest} />;
}

export function IconButton({
  label,
  className = "",
  size = "md",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" | "md"; children: ReactNode }) {
  const classes = [
    "btn",
    "btn-icon",
    size === "sm" ? "btn-sm" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" aria-label={label} title={label} className={classes} {...rest}>
      {children}
    </button>
  );
}
