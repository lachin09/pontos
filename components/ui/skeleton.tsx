import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "full";
}

const roundedClasses = {
  sm: "rounded-sm",
  md: "rounded-[var(--radius-control)]",
  full: "rounded-full",
} as const;

export function Skeleton({
  width,
  height,
  rounded = "md",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-surface-muted motion-reduce:animate-none ${roundedClasses[rounded]} ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}
