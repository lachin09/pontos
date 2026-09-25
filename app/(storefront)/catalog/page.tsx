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
import { formatPrice, pluralize } from "@/lib/utils/format";
import { filterAndSortProducts } from "@/services/product.service";

export const metadata: Metadata = {
  title: "Каталог одягу",
  description:
    "Перегляньте колекцію повсякденного одягу PONTOS та знайдіть свою річ.",
};

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
}: PageProps<"/catalog">) {
  const query = await searchParams;
  const categorySlug = firstValue(query.category);
  const size = firstValue(query.size);
  const color = firstValue(query.color);
  const minPrice = parsePrice(firstValue(query.minPrice));
  const maxPrice = parsePrice(firstValue(query.maxPrice));
  const availableOnly = firstValue(query.availability) === "available";
  const sort = parseSort(firstValue(query.sort));

  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getPublishedProducts(),
  ]);
  const selectedCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined;
  const sizes = Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.map((variant) => variant.size),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "uk"));
  const colors = Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.map((variant) => variant.color),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "uk"));
  const filteredProducts = filterAndSortProducts(products, {
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
    category: categorySlug,
    size,
    color,
    minPrice: minPrice?.toString(),
    maxPrice: maxPrice?.toString(),
    availability: availableOnly ? "available" : undefined,
    sort: sort === "featured" ? undefined : sort,
  };
  const activeChips = [
    size ? { label: `Розмір ${size}`, remove: { size: undefined } } : null,
    color ? { label: color, remove: { color: undefined } } : null,
    minPrice !== undefined
      ? {
          label: `від ${formatPrice(minPrice)}`,
          remove: { minPrice: undefined },
        }
      : null,
    maxPrice !== undefined
      ? {
          label: `до ${formatPrice(maxPrice)}`,
          remove: { maxPrice: undefined },
        }
      : null,
    availableOnly
      ? { label: "Є в наявності", remove: { availability: undefined } }
      : null,
  ].filter((chip) => chip !== null);
  const filterFormProps = {
    categories,
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
    <div className="mx-auto min-h-[65vh] max-w-[1440px] px-page py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <p className="eyebrow">PONTOS · essentials</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="text-4xl leading-tight sm:text-5xl">
              {selectedCategory?.name ?? "Каталог"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {selectedCategory?.description ||
                "Речі для щоденного гардероба — оберіть свою форму, колір і розмір."}
            </p>
          </div>
          <p className="text-sm text-muted tabular-nums" aria-live="polite">
            {filteredProducts.length}{" "}
            {pluralize(filteredProducts.length, ["товар", "товари", "товарів"])}
          </p>
        </div>
      </div>

      {categories.length > 0 ? (
        <nav
          aria-label="Категорії"
          className="scrollbar-none -mx-page mb-6 overflow-x-auto px-page sm:mb-8"
        >
          <ul className="flex w-max gap-2">
            {[{ name: "Усі", slug: undefined }, ...categories].map((item) => {
              const isCurrent = item.slug === categorySlug;
              return (
                <li key={item.slug ?? "all"}>
                  <Link
                    href={catalogHref(currentParams, { category: item.slug })}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${isCurrent ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:border-foreground"}`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <details className="group mb-5 rounded-[var(--radius-card)] border border-border bg-surface lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Фільтри та сортування
            {selectedFiltersCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.65rem] text-white">
                {selectedFiltersCount}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-normal text-muted group-open:hidden">
            Показати
          </span>
          <span className="hidden text-xs font-normal text-muted group-open:inline">
            Згорнути
          </span>
        </summary>
        <div className="border-t border-border p-4">
          <CatalogFilterForm idPrefix="catalog-mobile" {...filterFormProps} />
        </div>
      </details>

      <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside
          aria-label="Фільтри каталогу"
          className="hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 lg:sticky lg:top-24 lg:block"
        >
          <CatalogFilterForm idPrefix="catalog-desktop" {...filterFormProps} />
        </aside>

        <section aria-label="Товари">
          {categorySlug && !selectedCategory ? (
            <p className="mb-5 text-sm text-muted">
              Обрану категорію не знайдено.
            </p>
          ) : null}
          {activeChips.length > 0 ? (
            <ul
              className="mb-6 flex flex-wrap items-center gap-2"
              aria-label="Активні фільтри"
            >
              {activeChips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={catalogHref(currentParams, chip.remove)}
                    aria-label={`Прибрати фільтр: ${chip.label}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-muted py-1 pl-3.5 pr-2.5 text-xs font-medium transition-colors hover:bg-border"
                  >
                    {chip.label}
                    <X size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={catalogHref({}, { category: categorySlug })}
                  className="inline-flex min-h-9 items-center px-2 text-xs text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Скинути все
                </Link>
              </li>
            </ul>
          ) : null}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center">
              <div>
                <h2 className="text-2xl">Нічого не знайдено</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Спробуйте змінити фільтри або перегляньте всі товари колекції.
                </p>
                <Link
                  href="/catalog"
                  className={buttonClasses({ className: "mt-5" })}
                >
                  Очистити фільтри
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
