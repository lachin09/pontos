import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ProductDescription } from "@/components/product/product-description";
import { uniqueColors } from "@/lib/product/variants";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductColorProvider } from "@/components/product/product-color-context";
import { contactIcons } from "@/components/layout/contact-icons";
import { resolveContactLinks } from "@/components/layout/floating-contact-button";
import {
  getActiveCategories,
  getContactLinks,
  getPublishedProductBySlug,
  getRelatedProducts,
  getStoreInfo,
} from "@/lib/data/storefront";
import { localizeCategory, localizeProduct } from "@/lib/i18n/catalog";
import { colorName } from "@/lib/i18n/colors";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { telHref } from "@/lib/utils/format";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { t, locale } = await getI18n();
  const found = await getPublishedProductBySlug(slug);

  if (!found) return { title: t.product.notFoundTitle };
  const product = localizeProduct(found, locale);

  return {
    title: product.name,
    description: product.description,
    alternates: languageAlternates(`/product/${slug}`),
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

function DetailsSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-border">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={18}
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="pb-5 text-sm leading-7 text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({
  params,
}: PageProps<"/[lang]/product/[slug]">) {
  const { slug } = await params;
  const { t, locale, href } = await getI18n();
  const found = await getPublishedProductBySlug(slug);
  if (!found) notFound();
  const product = localizeProduct(found, locale);

  const [relatedProducts, categories, info, contactRecords] = await Promise.all(
    [
      getRelatedProducts(product.categoryId, product.id),
      getActiveCategories(),
      getStoreInfo().catch(() => EMPTY_STORE_INFO),
      getContactLinks().catch(() => []),
    ],
  );
  const rawCategory = categories.find((item) => item.id === product.categoryId);
  const category = rawCategory && localizeCategory(rawCategory, locale);
  const { seller } = info;
  const colors = uniqueColors(product.variants).map((variant) =>
    colorName(variant.color, locale),
  );
  const messengers = resolveContactLinks(contactRecords).filter(
    (link) => link.kind === "telegram" || link.kind === "whatsapp",
  );

  return (
    <div className="mx-auto max-w-[1440px] px-page pb-16 pt-6 sm:pb-24 sm:pt-10">
      <nav aria-label={t.product.breadcrumb} className="mb-5 sm:mb-8">
        <ol className="flex min-w-0 items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.16em] text-muted">
          <li>
            <Link
              href={href("/catalog")}
              className="py-2 transition-colors hover:text-foreground"
            >
              {t.product.catalog}
            </Link>
          </li>
          {category ? (
            <li className="flex items-center gap-1.5">
              <ChevronRight size={13} aria-hidden="true" />
              <Link
                href={href(`/catalog?category=${category.slug}`)}
                className="py-2 transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            </li>
          ) : null}
          <li className="flex min-w-0 items-center gap-1.5">
            <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
            <span aria-current="page" className="truncate text-foreground">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      <ProductColorProvider product={product}>
        <div className="grid items-start gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div className="-mx-page sm:mx-0">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>
          <div className="lg:sticky lg:top-24">
            <ProductPurchase product={product} />
            <div className="mt-8 border-t border-border">
              {product.description.trim() || product.composition ? (
                <DetailsSection title={t.product.description} defaultOpen>
                  <ProductDescription
                    locale={locale}
                    source={product.description}
                    extraSpecs={[
                      ...(product.composition
                        ? [
                            {
                              label: t.product.material,
                              value: product.composition,
                            },
                          ]
                        : []),
                      ...(colors.length > 0
                        ? [{ label: t.product.color, value: colors.join(", ") }]
                        : []),
                    ]}
                  />
                </DetailsSection>
              ) : null}
              {product.careInstructions ? (
                <DetailsSection title={t.product.care}>
                  <p>{product.careInstructions}</p>
                </DetailsSection>
              ) : null}
              <DetailsSection title={t.product.delivery}>
                <p>{t.product.deliveryText}</p>
                {info.pages.delivery.trim() ? (
                  <Link
                    href={href("/info/delivery")}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t.product.more} <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : null}
              </DetailsSection>
            </div>
            {messengers.length > 0 || seller.phone ? (
              <aside
                aria-label={t.product.sizeHelpLabel}
                className="mt-8 bg-surface-muted p-5 sm:p-6"
              >
                <p className="font-serif text-2xl leading-tight">
                  {t.product.sizeHelpTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t.product.sizeHelpText}{" "}
                  {seller.workingHours
                    ? `${t.product.sizeHelpShowroom}: ${seller.workingHours}.`
                    : `${t.product.sizeHelpShowroom}.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {messengers.map((link) => {
                    const Icon = contactIcons[link.kind];
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 border border-foreground/20 px-4 text-sm transition-colors hover:border-foreground"
                      >
                        <Icon size={15} aria-hidden="true" />
                        {link.label}
                      </a>
                    );
                  })}
                  {seller.phone ? (
                    <a
                      href={telHref(seller.phone)}
                      className="inline-flex min-h-10 items-center gap-2 border border-foreground/20 px-4 text-sm transition-colors hover:border-foreground"
                    >
                      {seller.phone}
                    </a>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </ProductColorProvider>

      {relatedProducts.length > 0 ? (
        <section className="mt-16 border-t border-border pt-12 sm:mt-24 sm:pt-16">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{t.product.relatedEyebrow}</p>
              <h2 className="mt-2 text-[1.75rem] leading-tight sm:text-4xl">
                {t.product.relatedTitle}
              </h2>
            </div>
            <Link
              href={href(
                category ? `/catalog?category=${category.slug}` : "/catalog",
              )}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t.product.relatedAll} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                product={localizeProduct(related, locale)}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
