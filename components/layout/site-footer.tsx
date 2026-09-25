import Link from "next/link";
import { getStoreInfo } from "@/lib/data/storefront";
import {
  EMPTY_STORE_INFO,
  INFO_PAGES,
  INFO_PAGE_SLUGS,
  type StoreInfo,
} from "@/lib/validators/store-info";

const shopLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/#categories", label: "Категорії" },
  { href: "/#new-in", label: "Новинки" },
];

const linkClass = "text-sm text-muted transition-colors hover:text-foreground";

export async function SiteFooter() {
  let info: StoreInfo = EMPTY_STORE_INFO;
  try {
    info = await getStoreInfo();
  } catch {
    // The footer still renders without the store information.
  }
  const infoLinks = INFO_PAGE_SLUGS.filter((slug) =>
    info.pages[slug].trim(),
  ).map((slug) => ({ href: `/info/${slug}`, label: INFO_PAGES[slug].footer }));
  const { seller } = info;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-page py-12 sm:grid-cols-[1.3fr_1fr_1fr] sm:py-16">
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
          {seller.phone || seller.email ? (
            <p className="mt-4 grid gap-1 text-sm">
              {seller.phone ? (
                <a
                  href={`tel:${seller.phone.replace(/[^\d+]/g, "")}`}
                  className="w-fit hover:text-accent"
                >
                  {seller.phone}
                </a>
              ) : null}
              {seller.email ? (
                <a
                  href={`mailto:${seller.email}`}
                  className="w-fit hover:text-accent"
                >
                  {seller.email}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
        <nav aria-label="Магазин" className="grid content-start gap-3">
          <p className="eyebrow">Магазин</p>
          {shopLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </nav>
        {infoLinks.length > 0 ? (
          <nav aria-label="Покупцям" className="grid content-start gap-3">
            <p className="eyebrow">Покупцям</p>
            {infoLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="border-t border-border px-page py-4">
        <p className="mx-auto flex max-w-[1440px] flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>© {new Date().getFullYear()} PONTOS. Усі права захищено.</span>
          {seller.legalName ? (
            <span>
              {seller.legalName}
              {seller.taxId ? `, код ${seller.taxId}` : ""}
            </span>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
