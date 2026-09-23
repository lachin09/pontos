"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  isPublished: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  category: string;
  stock: number;
  imageCount: number;
}

export function AdminProductsTable({
  products: initialProducts,
}: {
  products: AdminProductListItem[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const filteredProducts = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("uk");
    if (!search) return products;
    return products.filter((product) =>
      `${product.name} ${product.slug} ${product.category}`
        .toLocaleLowerCase("uk")
        .includes(search),
    );
  }, [products, query]);

  const removeProduct = async (product: AdminProductListItem) => {
    if (
      !window.confirm(`Видалити «${product.name}»? Цю дію не можна скасувати.`)
    )
      return;
    setPendingId(product.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        setNotice(result.error ?? "Не вдалося видалити товар.");
        return;
      }
      setProducts((current) =>
        current.filter((entry) => entry.id !== product.id),
      );
    } catch {
      setNotice("Не вдалося з’єднатися із сервером.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="mt-8">
      <label className="relative block max-w-md">
        <span className="sr-only">Пошук товарів</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          size={16}
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Назва, посилання або категорія"
          className="min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface pl-10 pr-3.5 text-sm outline-none focus:border-focus"
        />
      </label>
      {notice ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {notice}
        </p>
      ) : null}
      {filteredProducts.length === 0 ? (
        <div className="mt-5 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
          <p className="font-medium">
            {products.length ? "Нічого не знайдено" : "Товарів ще немає"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {products.length
              ? "Змініть пошуковий запит."
              : "Додайте перший товар до каталогу."}
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr_0.8fr_auto] gap-4 border-b border-border px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted md:grid">
            <span>Товар</span>
            <span>Категорія</span>
            <span>Ціна від</span>
            <span>Залишок</span>
            <span>Статус</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {filteredProducts.map((product) => (
              <li
                key={product.id}
                className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr_0.8fr_auto] md:items-center md:gap-4 md:px-5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 truncate text-xs text-muted">
                    /{product.slug} · {product.imageCount} фото
                  </p>
                </div>
                <span className="text-sm text-muted">{product.category}</span>
                <span className="text-sm tabular-nums">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm tabular-nums">
                  {product.stock} шт.
                </span>
                <span
                  className={`text-xs ${product.isPublished && product.isAvailable ? "text-emerald-700" : "text-muted"}`}
                >
                  {product.isPublished
                    ? product.isAvailable
                      ? "Опублікований"
                      : "Немає в наявності"
                    : "Чернетка"}
                </span>
                <button
                  type="button"
                  onClick={() => void removeProduct(product)}
                  disabled={pendingId === product.id}
                  aria-label={`Видалити ${product.name}`}
                  className="inline-grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
