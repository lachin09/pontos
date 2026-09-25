"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariantDraft } from "@/components/admin/product-form/types";

interface ProductVariantsSectionProps {
  variants: ProductVariantDraft[];
  onAdd: () => void;
  onChange: (index: number, patch: Partial<ProductVariantDraft>) => void;
  onRemove: (index: number) => void;
}

/** Editable rows of size / colour / stock / price combinations. */
export function ProductVariantsSection({
  variants,
  onAdd,
  onChange,
  onRemove,
}: ProductVariantsSectionProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-medium">Розміри, кольори та залишки</h2>
          <p className="mt-1 text-sm text-muted">
            Додайте окремий рядок для кожної комбінації розміру й кольору.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus size={15} aria-hidden="true" /> Додати варіант
        </Button>
      </div>
      <div className="mt-5 grid gap-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id ?? variant.sku}
            className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_0.8fr_0.7fr_0.8fr_auto]"
          >
            <Input
              id={`variant-size-${index}`}
              label="Розмір"
              required
              maxLength={40}
              value={variant.size}
              onChange={(event) =>
                onChange(index, { size: event.target.value })
              }
              placeholder="M"
            />
            <Input
              id={`variant-color-${index}`}
              label="Колір"
              required
              maxLength={80}
              value={variant.color}
              onChange={(event) =>
                onChange(index, { color: event.target.value })
              }
              placeholder="Чорний"
            />
            <div className="grid gap-1.5">
              <label
                htmlFor={`variant-color-hex-${index}`}
                className="text-sm font-medium"
              >
                Відтінок
              </label>
              <input
                id={`variant-color-hex-${index}`}
                type="color"
                value={variant.color_hex}
                onChange={(event) =>
                  onChange(index, { color_hex: event.target.value })
                }
                className="h-11 w-full cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
              />
            </div>
            <Input
              id={`variant-stock-${index}`}
              label="Залишок"
              type="number"
              min="0"
              max="100000"
              step="1"
              required
              value={variant.stock}
              onChange={(event) =>
                onChange(index, { stock: event.target.value })
              }
            />
            <Input
              id={`variant-price-${index}`}
              label="Ціна, ₴"
              type="number"
              min="0"
              step="0.01"
              required
              value={variant.price}
              onChange={(event) =>
                onChange(index, { price: event.target.value })
              }
            />
            <div className="flex items-end justify-between gap-3 lg:justify-end">
              <label className="mb-3 inline-flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={variant.is_available}
                  onChange={(event) =>
                    onChange(index, { is_available: event.target.checked })
                  }
                  className="size-4 accent-[var(--color-accent)]"
                />
                Активний
              </label>
              <button
                type="button"
                aria-label="Прибрати варіант"
                disabled={variants.length === 1}
                onClick={() => onRemove(index)}
                className="mb-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-40"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
            <Input
              id={`variant-sku-${index}`}
              label="Артикул (SKU)"
              required
              maxLength={80}
              className="sm:col-span-2 lg:col-span-3"
              value={variant.sku}
              onChange={(event) => onChange(index, { sku: event.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
