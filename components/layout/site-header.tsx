import { Phone } from "lucide-react";
import Link from "next/link";
import { CartLink } from "@/components/cart/cart-link";
import { HeaderNav } from "@/components/layout/header-nav";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { categoryLinks, type CategoryLink } from "@/lib/catalog/navigation";
import {
  getActiveCategories,
  getPublishedProducts,
  getStoreInfo,
} from "@/lib/data/storefront";
import { telHref } from "@/lib/utils/format";

export async function SiteHeader() {
  const [categories, products, info] = await Promise.allSettled([
    getActiveCategories(),
    getPublishedProducts(),
    getStoreInfo(),
  ]);
  // The header still works without category shortcuts or contacts.
  const links: CategoryLink[] =
    categories.status === "fulfilled" && products.status === "fulfilled"
      ? categoryLinks(categories.value, products.value)
      : [];
  const seller = info.status === "fulfilled" ? info.value.seller : undefined;
  const phone = seller?.phone.trim();

  return (
    <>
      <div className="bg-ink text-[0.66rem] tracking-[0.14em] text-white/75 sm:text-[0.7rem]">
        <div className="mx-auto flex min-h-9 max-w-[1440px] items-center justify-center gap-6 px-page py-2 sm:justify-between">
          <p className="text-center uppercase">
            Доставка по Україні та за кордон
            <span className="mx-2.5 text-gold" aria-hidden="true">
              ·
            </span>
            Оплата при отриманні
          </p>
          {phone ? (
            <p className="hidden items-center gap-4 sm:flex">
              {seller?.workingHours ? (
                <span className="text-white/55">{seller.workingHours}</span>
              ) : null}
              <a
                href={telHref(phone)}
                className="text-white transition-colors hover:text-gold"
              >
                {phone}
              </a>
            </p>
          ) : null}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-5 px-page sm:h-[4.75rem] lg:h-[5.25rem]">
          <Link
            href="/"
            aria-label="PONTOS — на головну"
            className="w-fit font-serif text-[1.45rem] font-medium uppercase leading-none tracking-[0.34em] text-foreground sm:text-[1.7rem]"
          >
            Pontos
          </Link>
          <HeaderNav links={links} />
          <div className="col-start-3 flex items-center justify-end gap-1">
            {phone ? (
              <a
                href={telHref(phone)}
                aria-label={`Подзвонити ${phone}`}
                className="hidden size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-muted md:grid"
              >
                <Phone size={18} aria-hidden="true" />
              </a>
            ) : null}
            <CartLink />
            <MobileNavigation
              links={links}
              phone={phone}
              workingHours={seller?.workingHours}
            />
          </div>
        </div>
      </header>
    </>
  );
}
