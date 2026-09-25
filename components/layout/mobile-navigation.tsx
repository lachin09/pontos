"use client";

import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button, buttonClasses } from "@/components/ui/button";
import { primaryLinks } from "@/components/layout/header-nav";

export function MobileNavigation({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-11 min-h-11 rounded-full px-0 md:hidden"
        aria-label="Відкрити меню"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={21} aria-hidden="true" />
      </Button>
      <Drawer open={open} onClose={close} title="Меню">
        <nav aria-label="Мобільна навігація" className="grid">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="flex min-h-14 items-center justify-between border-b border-border text-lg font-medium text-foreground transition-colors hover:text-accent"
            >
              {link.label}
              <ChevronRight
                size={18}
                className="text-muted"
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
        {categories.length > 0 ? (
          <section className="mt-8" aria-labelledby="mobile-categories">
            <h3 id="mobile-categories" className="eyebrow">
              Категорії
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/catalog?category=${category.slug}`}
                    onClick={close}
                    className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Link
          href="/catalog"
          onClick={close}
          className={buttonClasses({ size: "lg", className: "mt-10 w-full" })}
        >
          Переглянути колекцію
        </Link>
      </Drawer>
    </>
  );
}
