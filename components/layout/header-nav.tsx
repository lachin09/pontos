"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const primaryLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#categories", label: "Категорії" },
  { href: "/#new-in", label: "Новинки" },
  { href: "/#about", label: "Про нас" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Головна навігація"
      className="hidden items-center gap-8 md:flex"
    >
      {primaryLinks.map((link) => {
        const isCurrent = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrent ? "page" : undefined}
            className="relative py-2 text-[0.8rem] font-medium text-muted transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100 aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100"
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
