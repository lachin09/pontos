"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useDialogBehavior } from "@/components/ui/use-dialog-behavior";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  useDialogBehavior(open, panelRef, onClose);

  if (!open) return null;

  const sideClass = side === "right" ? "right-0 border-l" : "left-0 border-r";

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-y-0 flex w-full max-w-md flex-col border-border bg-surface shadow-[var(--shadow-popover)] outline-none ${sideClass}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2
            id={titleId}
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Close panel"
            onClick={onClose}
            className="size-9 min-h-9 px-0"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}
