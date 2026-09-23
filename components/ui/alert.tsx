import type { HTMLAttributes, ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

const alertClasses: Record<AlertVariant, string> = {
  info: "border-border bg-surface-muted text-foreground",
  success: "border-green-200 bg-green-50 text-success",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-danger",
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

export function Alert({
  variant = "info",
  title,
  className = "",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={`rounded-[var(--radius-control)] border px-4 py-3 text-sm ${alertClasses[variant]} ${className}`}
      role={variant === "error" ? "alert" : "status"}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
