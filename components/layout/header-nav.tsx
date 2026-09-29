"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GENDERS, type Gender } from "@/lib/catalog/gender";
import type { CategoryLink } from "@/lib/catalog/navigation";

const navLinkClass =
  "relative py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-foreground/80 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100 aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100";

/** The men's / women's lines that have something to show. */
export function availableLines(links: CategoryLink[]) {
  return GENDERS.filter((line) =>
    links.some((link) => link.gender === line.value),
  );
}

/** Categories of one line, plus categories that belong to neither. */
export function linksForLine(links: CategoryLink[], line: Gender | undefined) {
  return links.filter((link) => !line || !link.gender || link.gender === line);
}

export function LineSwitch({
  lines,
  value,
  onChange,
  className = "",
}: {
  lines: ReturnType<typeof availableLines>;
  value: Gender | undefined;
  onChange: (line: Gender) => void;
  className?: string;
}) {
  if (lines.length < 2) return null;
  return (
    <div
      role="group"
      aria-label="Колекція"
      className={`flex items-center gap-5 ${className}`}
    >
      {lines.map((line) => (
        <button
          key={line.value}
          type="button"
          aria-pressed={value === line.value}
          onClick={() => onChange(line.value)}
          className="border-b border-transparent pb-0.5 text-[0.66rem] font-medium uppercase tracking-[0.22em] text-muted transition-colors hover:text-foreground aria-pressed:border-gold aria-pressed:text-foreground"
        >
          {line.label}
        </button>
      ))}
    </div>
  );
}

export function HeaderNav({ links }: { links: CategoryLink[] }) {
  const pathname = usePathname();
  const lines = availableLines(links);
  const [line, setLine] = useState<Gender | undefined>(lines[0]?.value);
  const visibleLinks = linksForLine(links, line);

  return (
    <nav
      aria-label="Головна навігація"
      className="hidden flex-col items-center gap-2 lg:flex"
    >
      <LineSwitch lines={lines} value={line} onChange={setLine} />
      <ul className="flex items-center gap-7">
        {visibleLinks.map((link) => (
          <li key={link.slug}>
            <Link
              href={`/catalog?category=${link.slug}`}
              className={navLinkClass}
            >
              {link.shortName}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/catalog?sort=newest" className={navLinkClass}>
            Новинки
          </Link>
        </li>
        <li>
          <Link
            href="/catalog"
            aria-current={pathname === "/catalog" ? "page" : undefined}
            className={navLinkClass}
          >
            Каталог
          </Link>
        </li>
      </ul>
    </nav>
  );
}
