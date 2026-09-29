"use client";

import { ChevronRight, Menu, Phone } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  availableLines,
  LineSwitch,
  linksForLine,
} from "@/components/layout/header-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Gender } from "@/lib/catalog/gender";
import type { CategoryLink } from "@/lib/catalog/navigation";
import { useI18n } from "@/lib/i18n/client";
import { telHref } from "@/lib/utils/format";

const rowClass =
  "flex min-h-14 items-center justify-between gap-4 border-b border-border font-serif text-[1.35rem] text-foreground transition-colors hover:text-gold";

export function MobileNavigation({
  links,
  phone,
  workingHours,
}: {
  links: CategoryLink[];
  phone?: string;
  workingHours?: string;
}) {
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const lines = availableLines(links);
  const [line, setLine] = useState<Gender | undefined>(lines[0]?.value);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-11 min-h-11 rounded-full px-0 lg:hidden"
        aria-label={t.header.openMenu}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={21} aria-hidden="true" />
      </Button>
      <Drawer open={open} onClose={close} title={t.header.menu}>
        <LineSwitch
          lines={lines}
          value={line}
          onChange={setLine}
          className="mb-4"
        />
        <nav aria-label={t.header.mobileNav} className="grid">
          {linksForLine(links, line).map((link) => (
            <Link
              key={link.slug}
              href={href(`/catalog?category=${link.slug}`)}
              onClick={close}
              className={rowClass}
            >
              {link.shortName}
              <span className="flex items-center gap-2 font-sans text-xs text-muted">
                {link.productCount}
                <ChevronRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
          <Link
            href={href("/catalog?sort=newest")}
            onClick={close}
            className={rowClass}
          >
            {t.header.newIn}
            <ChevronRight size={16} className="text-muted" aria-hidden="true" />
          </Link>
          <Link href={href("/catalog")} onClick={close} className={rowClass}>
            {t.header.catalog}
            <ChevronRight size={16} className="text-muted" aria-hidden="true" />
          </Link>
        </nav>
        <LanguageSwitcher className="mt-8 text-sm tracking-[0.14em] text-muted" />
        {phone ? (
          <div className="mt-8 border-t border-border pt-6">
            <p className="eyebrow">{t.header.showroom}</p>
            <a
              href={telHref(phone)}
              className="mt-3 flex min-h-11 items-center gap-2 text-lg font-medium"
            >
              <Phone size={17} className="text-gold" aria-hidden="true" />
              {phone}
            </a>
            {workingHours ? (
              <p className="text-sm text-muted">{workingHours}</p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
