import { Phone } from "lucide-react";
import Link from "next/link";
import { Monogram } from "@/components/brand/monogram";
import { CartLink } from "@/components/cart/cart-link";
import { AddressLink } from "@/components/layout/address-link";
import { HeaderNav } from "@/components/layout/header-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { categoryLinks, type CategoryLink } from "@/lib/catalog/navigation";
import {
  getActiveCategories,
  getPublishedProducts,
  getStoreInfo,
} from "@/lib/data/storefront";
import {
  shortAddress,
  showroomAddress,
  showroomMapHref,
} from "@/lib/content/showroom";
import { localizeCategory } from "@/lib/i18n/catalog";
import { fill } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";
import { telHref } from "@/lib/utils/format";

export async function SiteHeader() {
  const { t, locale, href } = await getI18n();
  const [categories, products, info] = await Promise.allSettled([
    getActiveCategories(),
    getPublishedProducts(),
    getStoreInfo(),
  ]);
  // The header still works without category shortcuts or contacts.
  const links: CategoryLink[] =
    categories.status === "fulfilled" && products.status === "fulfilled"
      ? categoryLinks(
          categories.value.map((category) =>
            localizeCategory(category, locale),
          ),
          products.value,
        )
      : [];
  const seller = info.status === "fulfilled" ? info.value.seller : undefined;
  const phone = seller?.phone.trim();
  const address = seller ? showroomAddress(seller, locale) : "";
  const mapHref = seller ? showroomMapHref(seller) : undefined;

  return (
    <>
      <div className="bg-ink text-[0.66rem] tracking-[0.14em] text-white/75 sm:text-[0.7rem]">
        <div className="mx-auto flex min-h-9 max-w-[1440px] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-page py-2 sm:justify-between">
          <p className="text-center uppercase sm:whitespace-nowrap">
            {t.header.delivery}
            <span className="mx-2.5 text-gold" aria-hidden="true">
              ·
            </span>
            {t.header.payment}
          </p>
          <div className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:flex">
            {phone || address ? (
              <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                {address && mapHref ? (
                  <AddressLink
                    address={shortAddress(address)}
                    href={mapHref}
                    label={t.header.openMap}
                    className="flex items-center gap-1.5 whitespace-nowrap normal-case tracking-[0.06em] text-white/70 transition-colors hover:text-gold"
                    iconClassName="text-gold"
                  />
                ) : null}
                {seller?.workingHours ? (
                  <span className="whitespace-nowrap text-white/55">
                    {seller.workingHours}
                  </span>
                ) : null}
                {phone ? (
                  <a
                    href={telHref(phone)}
                    className="whitespace-nowrap text-white transition-colors hover:text-gold"
                  >
                    {phone}
                  </a>
                ) : null}
              </p>
            ) : null}
            <LanguageSwitcher className="text-white/60" />
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-5 px-page sm:h-[4.75rem] lg:h-[5.25rem]">
          <Link
            href={href("/")}
            aria-label={t.header.homeLabel}
            className="flex w-fit items-center gap-3 text-foreground sm:gap-3.5"
          >
            <Monogram className="h-8 w-auto sm:h-10" />
            <span className="font-serif text-[1.3rem] font-medium uppercase leading-none tracking-[0.3em] sm:text-[1.7rem] sm:tracking-[0.34em]">
              Pontos
            </span>
          </Link>
          <HeaderNav links={links} />
          <div className="col-start-3 flex items-center justify-end gap-1">
            {phone ? (
              <a
                href={telHref(phone)}
                aria-label={fill(t.header.call, { phone })}
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
              address={address}
              mapHref={mapHref}
            />
          </div>
        </div>
      </header>
    </>
  );
}
