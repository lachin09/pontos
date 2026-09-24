"use client";

import { useState } from "react";
import {
  Camera,
  Link2,
  MessageCircle,
  Music2,
  Phone,
  Send,
  X,
} from "lucide-react";

export type ContactLink = {
  kind: "phone" | "whatsapp" | "telegram" | "instagram" | "tiktok" | "custom";
  label: string;
  href: string;
  detail?: string;
};

const icons = {
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Camera,
  tiktok: Music2,
  custom: Link2,
};

export function FloatingContactMenu({ links }: { links: ContactLink[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (links.length === 0) return null;

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 sm:right-6">
      <section
        id="floating-contact-panel"
        aria-label="Контакти PONTOS"
        hidden={!isOpen}
        className="w-[min(21rem,calc(100vw-2rem))] origin-bottom-right rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-popover)] sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">Зв’яжіться з нами</p>
            <p className="mt-0.5 text-xs text-muted">
              Допоможемо з вибором і замовленням
            </p>
          </div>
          <button
            type="button"
            aria-label="Закрити контакти"
            onClick={() => setIsOpen(false)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Канали зв’язку" className="grid gap-1">
          {links.map((link) => {
            const Icon = icons[link.kind];
            return (
              <a
                key={link.kind}
                href={link.href}
                target={link.kind === "phone" ? undefined : "_blank"}
                rel={link.kind === "phone" ? undefined : "noopener noreferrer"}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-accent">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{link.label}</span>
                  {link.detail ? (
                    <span className="block truncate text-xs text-muted">
                      {link.detail}
                    </span>
                  ) : null}
                </span>
              </a>
            );
          })}
        </nav>
      </section>

      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="floating-contact-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-14 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[var(--shadow-popover)] transition-transform hover:scale-[1.03] hover:bg-accent-hover focus-visible:outline-offset-4"
      >
        {isOpen ? (
          <X size={18} aria-hidden="true" />
        ) : (
          <MessageCircle size={18} aria-hidden="true" />
        )}
        <span>{isOpen ? "Закрити" : "Контакти"}</span>
      </button>
    </div>
  );
}
