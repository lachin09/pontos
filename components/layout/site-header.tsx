import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CartLink } from "@/components/cart/cart-link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#categories", label: "Категорії" },
  { href: "/#new-in", label: "Новинки" },
  { href: "/#about", label: "Про нас" },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-accent px-4 py-2 text-center text-[0.65rem] font-medium tracking-[0.08em] text-accent-foreground sm:text-xs">
        Доставка Україною <span className="mx-2 text-white/50">·</span> Оплата
        при отриманні або переказом
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-[4.25rem] max-w-[1440px] items-center justify-between gap-5 px-page sm:h-[4.75rem]">
          <Link
            href="/"
            aria-label="Pontos — на головну"
            className="shrink-0 text-[1.05rem] font-semibold tracking-[0.22em] text-foreground sm:text-xl"
          >
            PONTOS<span className="text-highlight">.</span>
          </Link>
          <nav
            aria-label="Головна навігація"
            className="hidden items-center gap-8 md:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-[0.8rem] font-medium text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CartLink />
            <Link
              href="/catalog"
              className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent-hover sm:inline-flex"
            >
              Обрати річ <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <MobileNavigation />
          </div>
        </div>
      </header>
    </>
  );
}
