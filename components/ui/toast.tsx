"use client";

import { useEffect, type ReactNode } from "react";

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  duration?: number;
  variant?: "success" | "error" | "info";
}

const variantClasses = {
  success: "border-green-200 bg-green-50 text-success",
  error: "border-red-200 bg-red-50 text-danger",
  info: "border-border bg-surface text-foreground",
} as const;

export function Toast({
  open,
  onClose,
  children,
  duration = 4000,
  variant = "success",
}: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onClose, open]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:justify-end">
      <div
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={`pointer-events-auto w-full max-w-sm rounded-[var(--radius-control)] border px-4 py-3 text-sm shadow-[var(--shadow-popover)] ${variantClasses[variant]}`}
      >
        {children}
      </div>
    </div>
  );
}
