import type { ReactNode } from "react";
import Link from "next/link";
import { contactIcons } from "@/components/layout/contact-icons";
import { resolveContactLinks } from "@/components/layout/floating-contact-button";
import { categoryLinks, type CategoryLink } from "@/lib/catalog/navigation";
import {
  getActiveCategories,
  getContactLinks,
  getPublishedProducts,
  getStoreInfo,
} from "@/lib/data/storefront";
import { telHref } from "@/lib/utils/format";
import {
  EMPTY_STORE_INFO,
  INFO_PAGES,
  INFO_PAGE_SLUGS,
} from "@/lib/validators/store-info";

const linkClass =
  "w-fit text-sm text-white/60 transition-colors hover:text-white";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={title} className="grid content-start gap-3">
      <p className="eyebrow mb-1">{title}</p>
      {children}
    </nav>
  );
}

export async function SiteFooter() {
  const [infoResult, contactsResult, categoriesResult, productsResult] =
    await Promise.allSettled([
      getStoreInfo(),
      getContactLinks(),
      getActiveCategories(),
      getPublishedProducts(),
    ]);
  // Each part is optional; the footer renders with whatever loaded.
  const info =
    infoResult.status === "fulfilled" ? infoResult.value : EMPTY_STORE_INFO;
  const socials = (
    contactsResult.status === "fulfilled"
      ? resolveContactLinks(contactsResult.value)
      : []
  ).filter((link) => link.kind !== "phone");
  const categories: CategoryLink[] =
    categoriesResult.status === "fulfilled" &&
    productsResult.status === "fulfilled"
      ? categoryLinks(categoriesResult.value, productsResult.value)
      : [];
  const infoLinks = INFO_PAGE_SLUGS.filter((slug) =>
    info.pages[slug].trim(),
  ).map((slug) => ({ href: `/info/${slug}`, label: INFO_PAGES[slug].footer }));
  const { seller } = info;

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-page py-14 sm:grid-cols-2 sm:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <Link
            href="/"
            className="font-serif text-[1.9rem] font-medium uppercase leading-none tracking-[0.34em]"
          >
            Pontos
          </Link>
          <p className="mt-4 max-w-xs font-serif text-lg italic leading-snug text-white/60">
            Натуральна шкіра, замша та хутро.
          </p>
          {socials.length > 0 ? (
            <ul className="mt-6 flex gap-2">
              {socials.map((link) => {
                const Icon = contactIcons[link.kind];
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="grid size-10 place-items-center rounded-full border border-white/20 text-white/75 transition-colors hover:border-gold hover:text-gold"
                    >
                      <Icon size={16} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <FooterColumn title="Колекції">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog?category=${category.slug}`}
                className={linkClass}
              >
                {category.name}
              </Link>
            ))}
          </FooterColumn>
        ) : null}

        <FooterColumn title="Покупцям">
          <Link href="/catalog" className={linkClass}>
            Каталог
          </Link>
          <Link href="/catalog?sort=newest" className={linkClass}>
            Новинки
          </Link>
          {infoLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
        </FooterColumn>

        <div className="grid content-start gap-3 text-sm">
          <p className="eyebrow mb-1">Шоурум у Києві</p>
          {seller.workingHours ? (
            <p className="text-white/60">{seller.workingHours}</p>
          ) : null}
          {seller.phone ? (
            <a
              href={telHref(seller.phone)}
              className="w-fit text-base text-white transition-colors hover:text-gold"
            >
              {seller.phone}
            </a>
          ) : null}
          {seller.email ? (
            <a
              href={`mailto:${seller.email}`}
              className="w-fit text-white/60 transition-colors hover:text-white"
            >
              {seller.email}
            </a>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/10 px-page py-5">
        <p className="mx-auto flex max-w-[1440px] flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
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
