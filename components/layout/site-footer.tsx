import Link from "next/link";

const footerLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#categories", label: "Категорії" },
  { href: "/#new-in", label: "Новинки" },
  { href: "/#delivery", label: "Доставка й оплата" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-page py-12 sm:grid-cols-[1.3fr_1fr] sm:py-16">
        <div>
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.24em] text-foreground"
          >
            PONTOS<span className="text-highlight">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            Продумані речі для щоденного гардероба. Створені, щоб носити знову.
          </p>
        </div>
        <nav
          aria-label="Навігація в підвалі"
          className="grid grid-cols-2 gap-x-6 gap-y-3 sm:justify-self-end"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border px-page py-4">
        <p className="mx-auto max-w-[1440px] text-xs text-muted">
          © {new Date().getFullYear()} PONTOS. Усі права захищено.
        </p>
      </div>
    </footer>
  );
}
