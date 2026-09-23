import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { CatalogFilterForm } from "@/components/catalog/catalog-filter-form";
import { ProductCard } from "@/components/product/product-card";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/constants/product";
import { createCategoryService } from "@/services/category.service";
import {
  createProductService,
  filterAndSortProducts,
} from "@/services/product.service";
import { createSupabaseCategoryRepository } from "@/repositories/supabase/category.repository";
import { createSupabaseProductRepository } from "@/repositories/supabase/product.repository";

export const metadata: Metadata = {
  title: "Каталог одягу",
  description:
    "Перегляньте колекцію повсякденного одягу PONTOS та знайдіть свою річ.",
};

const productService = createProductService(createSupabaseProductRepository());
const categoryService = createCategoryService(
  createSupabaseCategoryRepository(),
);

type SearchValue = string | string[] | undefined;

function firstValue(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
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
    categoryService.listActiveCategories(),
    productService.listProducts(),
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

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1440px] px-page py-10 sm:py-14">
      <div className="mb-9 border-b border-border pb-7 sm:mb-12 sm:pb-9">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
          PONTOS · essentials
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
              Каталог
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Речі для щоденного гардероба — оберіть свою форму, колір і розмір.
            </p>
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "товар" : "товарів"}
          </p>
        </div>
      </div>

      <details className="group mb-5 rounded-[var(--radius-card)] border border-border bg-surface p-4 lg:hidden">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Фільтри
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
        <div className="mt-4 border-t border-border pt-4">
          <CatalogFilterForm
            idPrefix="catalog-mobile"
            categories={categories}
            sizes={sizes}
            colors={colors}
            category={categorySlug}
            size={size}
            color={color}
            minPrice={minPrice}
            maxPrice={maxPrice}
            availableOnly={availableOnly}
            sort={sort}
            selectedFiltersCount={selectedFiltersCount}
          />
        </div>
      </details>

      <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside
          aria-label="Фільтри каталогу"
          className="hidden rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 lg:block"
        >
          <CatalogFilterForm
            idPrefix="catalog-desktop"
            categories={categories}
            sizes={sizes}
            colors={colors}
            category={categorySlug}
            size={size}
            color={color}
            minPrice={minPrice}
            maxPrice={maxPrice}
            availableOnly={availableOnly}
            sort={sort}
            selectedFiltersCount={selectedFiltersCount}
          />
        </aside>

        <section aria-label="Товари">
          {categorySlug && !selectedCategory ? (
            <p className="mb-5 text-sm text-muted">
              Обрану категорію не знайдено.
            </p>
          ) : null}
          {selectedCategory ? (
            <div className="mb-5">
              <h2 className="text-xl font-medium">{selectedCategory.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {selectedCategory.description}
              </p>
            </div>
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
                <h2 className="text-lg font-medium">Нічого не знайдено</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                  Спробуйте змінити фільтри або перегляньте всі товари колекції.
                </p>
                <Link
                  href="/catalog"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
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
