"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

  // Portal to <body>: inside a sticky or transformed parent the toast would
  // be trapped under the site header. Top placement keeps it clear of the
  // floating contact button. (Only rendered after user actions, so
  // `document` always exists here.)
  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center sm:inset-x-6 sm:justify-end">
      <div
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={`pointer-events-auto flex w-full max-w-sm animate-slide-down items-start gap-3 rounded-[var(--radius-card)] border py-3 pl-4 pr-2 text-sm shadow-[var(--shadow-popover)] ${variantClasses[variant]}`}
      >
        <div className="min-w-0 flex-1 py-1">{children}</div>
        <button
          type="button"
          aria-label="Закрити сповіщення"
          onClick={onClose}
          className="grid size-8 shrink-0 place-items-center rounded-full opacity-70 transition-opacity hover:opacity-100"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
