import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({
  interactive = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const interaction = interactive
    ? "transition-shadow hover:shadow-[var(--shadow-popover)]"
    : "";

  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-surface ${interaction} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
