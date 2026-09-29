import type { Metadata } from "next";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { CatalogFilterForm } from "@/components/catalog/catalog-filter-form";
import { ProductCard } from "@/components/product/product-card";
import { buttonClasses } from "@/components/ui/button";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants/product";
import {
  getActiveCategories,
  getPublishedProducts,
} from "@/lib/data/storefront";
import { categoryGender, GENDERS, parseGender } from "@/lib/catalog/gender";
import { compareSizes } from "@/lib/product/sizes";
import { localizeCategory, localizeProduct } from "@/lib/i18n/catalog";
import { colorName } from "@/lib/i18n/colors";
import { fill } from "@/lib/i18n/dictionaries";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { formatPrice } from "@/lib/utils/format";
import { filterAndSortProducts } from "@/services/product.service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.catalog.metaTitle,
    description: t.catalog.metaDescription,
    alternates: languageAlternates("/catalog"),
  };
}

type SearchValue = string | string[] | undefined;

function firstValue(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Builds a catalog URL from the current filters with some keys changed. */
function catalogHref(
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function parseSort(value: string | undefined): ProductSort {
  return PRODUCT_SORTS.find((sort) => sort === value) ?? "featured";
}

export default async function CatalogPage({
  searchParams,
}: PageProps<"/[lang]/catalog">) {
  const query = await searchParams;
  const categorySlug = firstValue(query.category);
  const size = firstValue(query.size);
  const color = firstValue(query.color);
  const minPrice = parsePrice(firstValue(query.minPrice));
  const maxPrice = parsePrice(firstValue(query.maxPrice));
  const availableOnly = firstValue(query.availability) === "available";
  const sort = parseSort(firstValue(query.sort));
  const gender = parseGender(firstValue(query.gender));

  const { t, locale, href, plural } = await getI18n();
  const [rawCategories, rawProducts] = await Promise.all([
    getActiveCategories(),
    getPublishedProducts(),
  ]);
  const categories = rawCategories.map((category) =>
    localizeCategory(category, locale),
  );
  const products = rawProducts.map((product) =>
    localizeProduct(product, locale),
  );
  const link = (
    current: Record<string, string | undefined>,
    changes: Record<string, string | undefined>,
  ) => href(catalogHref(current, changes));
  const selectedCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;
  // A chosen line (men's / women's) narrows the categories and products.
  const lineCategories = gender
    ? categories.filter((category) => categoryGender(category) === gender)
    : categories;
  const lineCategoryIds = new Set(
    lineCategories.map((category) => category.id),
  );
  const lineProducts = gender
    ? products.filter((product) => lineCategoryIds.has(product.categoryId))
    : products;
  const categoryProductCounts = new Map<string, number>();
  for (const product of lineProducts) {
    categoryProductCounts.set(
      product.categoryId,
      (categoryProductCounts.get(product.categoryId) ?? 0) + 1,
    );
  }
  const visibleCategories = lineCategories.filter((category) =>
    categoryProductCounts.has(category.id),
  );
  const lines = GENDERS.filter((line) =>
    products.some((product) => {
      const category = categories.find(
        (item) => item.id === product.categoryId,
      );
      return category ? categoryGender(category) === line.value : false;
    }),
  );
  // Size and colour options come from the products being browsed.
  const scopeProducts = selectedCategory
    ? lineProducts.filter(
        (product) => product.categoryId === selectedCategory.id,
      )
    : lineProducts;
  const sizes = Array.from(
    new Set(
      scopeProducts.flatMap((product) =>
        product.variants.map((variant) => variant.size),
      ),
    ),
  ).sort(compareSizes);
  const colors = Array.from(
    new Set(
      scopeProducts.flatMap((product) =>
        product.variants.map((variant) => variant.color),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "uk"));
  const filteredProducts = filterAndSortProducts(lineProducts, {
    categoryId: categorySlug
      ? (selectedCategory?.id ?? "__unknown_category__")
      : undefined,
    size,
    color,
    minPrice,
    maxPrice,
    availableOnly,
    sort,
  });
  const selectedFiltersCount = [
    categorySlug,
    size,
    color,
    minPrice !== undefined ? "minPrice" : undefined,
    maxPrice !== undefined ? "maxPrice" : undefined,
    availableOnly ? "availability" : undefined,
  ].filter(Boolean).length;
  const currentParams: Record<string, string | undefined> = {
    gender,
    category: categorySlug,
    size,
    color,
    minPrice: minPrice?.toString(),
    maxPrice: maxPrice?.toString(),
    availability: availableOnly ? "available" : undefined,
    sort: sort === "featured" ? undefined : sort,
  };
  const activeChips = [
    size
      ? {
          label: fill(t.catalog.sizeChip, { size }),
          remove: { size: undefined },
        }
      : null,
    color
      ? { label: colorName(color, locale), remove: { color: undefined } }
      : null,
    minPrice !== undefined
      ? {
          label: fill(t.catalog.priceFrom, { price: formatPrice(minPrice) }),
          remove: { minPrice: undefined },
        }
      : null,
    maxPrice !== undefined
      ? {
          label: fill(t.catalog.priceTo, { price: formatPrice(maxPrice) }),
          remove: { maxPrice: undefined },
        }
      : null,
    availableOnly
      ? { label: t.catalog.inStock, remove: { availability: undefined } }
      : null,
  ].filter((chip) => chip !== null);
  const filterFormProps = {
    locale,
    categories: visibleCategories,
    gender,
    sizes,
    colors,
    category: categorySlug,
    size,
    color,
    minPrice,
    maxPrice,
    availableOnly,
    sort,
    selectedFiltersCount,
  };

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1440px] px-page py-10 sm:py-14">
      <div className="mb-8 border-b border-border pb-8 sm:mb-10">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          {gender ? t.lines[gender] : "PONTOS"}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div>
            <h1 className="text-[2.75rem] leading-none sm:text-6xl">
              {selectedCategory?.name ?? t.catalog.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              {selectedCategory?.description || t.catalog.description}
            </p>
          </div>
          <p className="text-sm text-muted tabular-nums" aria-live="polite">
            {filteredProducts.length}{" "}
            {plural(filteredProducts.length, t.common.items)}
          </p>
        </div>
        {lines.length > 1 ? (
          <nav aria-label={t.catalog.linesLabel} className="mt-6 flex gap-6">
            {[
              { value: undefined, label: t.lines.all },
              ...lines.map((line) => ({ ...line, label: t.lines[line.value] })),
            ].map((line) => {
              const isCurrent = line.value === gender;
              return (
                <Link
                  key={line.label}
                  href={link(
                    { sort: currentParams.sort },
                    { gender: line.value },
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                  className="border-b border-transparent pb-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground aria-[current=page]:border-gold aria-[current=page]:text-foreground"
                >
                  {line.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>

      {visibleCategories.length > 0 ? (
        <nav
          aria-label={t.catalog.categoriesLabel}
          className="scrollbar-none -mx-page mb-8 overflow-x-auto px-page"
        >
          <ul className="flex w-max gap-2">
            {[
              { name: t.catalog.all, slug: undefined },
              ...visibleCategories,
            ].map((item) => {
              const isCurrent = item.slug === categorySlug;
              return (
                <li key={item.slug ?? "all"}>
                  <Link
                    href={link(currentParams, { category: item.slug })}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center whitespace-nowrap border px-4 text-[0.8rem] tracking-[0.02em] transition-colors ${isCurrent ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:border-foreground"}`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <details className="group mb-6 border border-border bg-surface lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} aria-hidden="true" />
            {t.catalog.filtersAndSort}
            {selectedFiltersCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.65rem] text-white">
                {selectedFiltersCount}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-normal text-muted group-open:hidden">
            {t.catalog.show}
          </span>
          <span className="hidden text-xs font-normal text-muted group-open:inline">
            {t.catalog.hide}
          </span>
        </summary>
        <div className="border-t border-border p-4">
          <CatalogFilterForm idPrefix="catalog-mobile" {...filterFormProps} />
        </div>
      </details>

      <div className="grid items-start gap-8 lg:grid-cols-[250px_1fr] lg:gap-10">
        <aside
          aria-label={t.catalog.filtersLabel}
          className="hidden border-r border-border pr-8 lg:sticky lg:top-32 lg:block"
        >
          <CatalogFilterForm idPrefix="catalog-desktop" {...filterFormProps} />
        </aside>

        <section aria-label={t.catalog.productsLabel}>
          {categorySlug && !selectedCategory ? (
            <p className="mb-5 text-sm text-muted">
              {t.catalog.categoryNotFound}
            </p>
          ) : null}
          {activeChips.length > 0 ? (
            <ul
              className="mb-6 flex flex-wrap items-center gap-2"
              aria-label={t.catalog.activeFilters}
            >
              {activeChips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={link(currentParams, chip.remove)}
                    aria-label={fill(t.catalog.removeFilter, {
                      label: chip.label,
                    })}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-muted py-1 pl-3.5 pr-2.5 text-xs font-medium transition-colors hover:bg-border"
                  >
                    {chip.label}
                    <X size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={link({}, { gender, category: categorySlug })}
                  className="inline-flex min-h-9 items-center px-2 text-xs text-muted underline underline-offset-4 hover:text-foreground"
                >
                  {t.catalog.resetAll}
                </Link>
              </li>
            </ul>
          ) : null}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center border border-dashed border-border bg-surface px-6 py-12 text-center">
              <div>
                <h2 className="text-3xl">{t.catalog.emptyTitle}</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  {t.catalog.emptyText}
                </p>
                <Link
                  href={href("/catalog")}
                  className={buttonClasses({ className: "mt-5" })}
                >
                  {t.catalog.clearFilters}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
