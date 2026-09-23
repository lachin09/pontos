import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "neutral" | "accent" | "sale" | "success" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground",
  accent: "bg-accent text-accent-foreground",
  sale: "bg-highlight text-white",
  success: "bg-green-100 text-success",
  danger: "bg-red-100 text-danger",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-medium leading-none tracking-wide ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
