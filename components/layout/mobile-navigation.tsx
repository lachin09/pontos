"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#categories", label: "Категорії" },
  { href: "/#new-in", label: "Новинки" },
  { href: "/#about", label: "Про нас" },
];

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-10 min-h-10 px-0 md:hidden"
        aria-label="Відкрити меню"
        onClick={() => setOpen(true)}
      >
        <Menu size={21} aria-hidden="true" />
      </Button>
      <Drawer open={open} onClose={close} title="Навігація">
        <nav aria-label="Мобільна навігація" className="grid gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-surface-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/catalog"
          onClick={close}
          className="mt-8 flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          Переглянути колекцію
        </Link>
      </Drawer>
    </>
  );
}
