import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-accent text-accent-foreground hover:bg-accent-hover",
  secondary:
    "border-transparent bg-surface-muted text-foreground hover:bg-border",
  outline:
    "border-border bg-transparent text-foreground hover:bg-surface-muted",
  ghost:
    "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
  danger: "border-transparent bg-danger text-white hover:bg-red-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-sm",
};

/** Button styling for elements that are not <button>, such as links. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-medium transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel = "Зачекайте",
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner label={loadingLabel} size="sm" /> : null}
      {children}
    </button>
  );
}
