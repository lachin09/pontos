"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LETTER_SIZE_OPTIONS,
  NUMERIC_SIZE_OPTIONS,
  parseSizes,
  sameSize,
} from "@/lib/product/sizes";
import {
  addSizes,
  hasSize,
  removeSize,
} from "@/components/admin/product-form/product-draft";
import type {
  ProductColorDraft,
  ProductSizeDraft,
} from "@/components/admin/product-form/types";

interface ProductVariantsSectionProps {
  colors: ProductColorDraft[];
  /** Base product price, used for sizes as they are added. */
  price: string;
  onAdd: () => void;
  onChange: (index: number, patch: Partial<ProductColorDraft>) => void;
  onRemove: (index: number) => void;
}

const PRESET_SIZES = [...LETTER_SIZE_OPTIONS, ...NUMERIC_SIZE_OPTIONS];

/** One card per colour: pick its sizes, then set stock and price per size. */
export function ProductVariantsSection({
  colors,
  price,
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
            Додайте колір і позначте розміри, у яких він є.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus size={15} aria-hidden="true" /> Додати колір
        </Button>
      </div>
      <div className="mt-5 grid gap-4">
        {colors.map((color, index) => (
          <ColorCard
            key={color.key}
            color={color}
            index={index}
            price={price}
            removable={colors.length > 1}
            onChange={(patch) => onChange(index, patch)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>
    </section>
  );
}

interface ColorCardProps {
  color: ProductColorDraft;
  index: number;
  price: string;
  removable: boolean;
  onChange: (patch: Partial<ProductColorDraft>) => void;
  onRemove: () => void;
}

function ColorCard({
  color,
  index,
  price,
  removable,
  onChange,
  onRemove,
}: ColorCardProps) {
  const [customSizes, setCustomSizes] = useState("");
  const { sizes } = color;
  const otherSizes = sizes
    .map((size) => size.size.trim())
    .filter(
      (label) =>
        label && !PRESET_SIZES.some((preset) => sameSize(preset, label)),
    );

  const toggleSize = (label: string) =>
    onChange({
      sizes: hasSize(sizes, label)
        ? removeSize(sizes, label)
        : addSizes(sizes, [label], price),
    });

  const addCustomSizes = () => {
    onChange({ sizes: addSizes(sizes, parseSizes(customSizes), price) });
    setCustomSizes("");
  };

  const updateSize = (key: string, patch: Partial<ProductSizeDraft>) =>
    onChange({
      sizes: sizes.map((size) =>
        size.key === key ? { ...size, ...patch } : size,
      ),
    });

  const sizeChips = (title: string, labels: string[]) => (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-xs text-muted">{title}</span>
      {labels.map((label) => {
        const selected = hasSize(sizes, label);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={() => toggleSize(label)}
            className={`min-h-9 min-w-11 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
              selected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-foreground hover:bg-surface-muted"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid gap-4 rounded-md border border-border p-4">
      <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1.5fr_0.5fr_auto]">
        <Input
          id={`color-name-${index}`}
          label="Колір"
          required
          maxLength={80}
          value={color.color}
          onChange={(event) => onChange({ color: event.target.value })}
          placeholder="Чорний"
        />
        <div className="order-last col-span-2 grid gap-1.5 sm:order-none sm:col-span-1">
          <label htmlFor={`color-hex-${index}`} className="text-sm font-medium">
            Відтінок
          </label>
          <input
            id={`color-hex-${index}`}
            type="color"
            value={color.color_hex}
            onChange={(event) => onChange({ color_hex: event.target.value })}
            className="h-11 w-full cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
          />
        </div>
        <button
          type="button"
          aria-label="Прибрати колір"
          disabled={!removable}
          onClick={onRemove}
          className="mb-1 grid size-9 place-items-center self-end rounded-full text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-40"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-medium">Розміри</legend>
        {sizeChips("Літерні", LETTER_SIZE_OPTIONS)}
        {sizeChips("Цифрові", NUMERIC_SIZE_OPTIONS)}
        {otherSizes.length > 0 ? sizeChips("Інші", otherSizes) : null}
        <div className="flex items-end gap-2 sm:max-w-md">
          <div className="flex-1">
            <Input
              id={`color-custom-sizes-${index}`}
              label="Інший розмір"
              value={customSizes}
              onChange={(event) => setCustomSizes(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                // Enter adds the sizes instead of submitting the product.
                event.preventDefault();
                addCustomSizes();
              }}
              placeholder="6XL, 66 або Один розмір"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="mb-px"
            disabled={!customSizes.trim()}
            onClick={addCustomSizes}
          >
            Додати
          </Button>
        </div>
      </fieldset>

      {sizes.length > 0 ? (
        <div className="grid gap-3 border-t border-border pt-4">
          {sizes.map((size, row) => {
            const id = `color-${index}-size-${row}`;
            // On wide screens only the first row shows the column labels.
            const label = (text: string) => (
              <span className={row > 0 ? "lg:sr-only" : ""}>{text}</span>
            );
            return (
              <div
                key={size.key}
                className="grid grid-cols-2 gap-3 lg:grid-cols-[0.7fr_0.7fr_0.8fr_1.5fr_auto]"
              >
                <Input
                  id={`${id}-label`}
                  label={label("Розмір")}
                  required
                  maxLength={40}
                  value={size.size}
                  onChange={(event) =>
                    updateSize(size.key, { size: event.target.value })
                  }
                />
                <Input
                  id={`${id}-stock`}
                  label={label("Залишок")}
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  required
                  value={size.stock}
                  onChange={(event) =>
                    updateSize(size.key, { stock: event.target.value })
                  }
                />
                <Input
                  id={`${id}-price`}
                  label={label("Ціна, ₴")}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={size.price}
                  onChange={(event) =>
                    updateSize(size.key, { price: event.target.value })
                  }
                />
                <Input
                  id={`${id}-sku`}
                  label={label("Артикул (SKU)")}
                  required
                  maxLength={80}
                  value={size.sku}
                  onChange={(event) =>
                    updateSize(size.key, { sku: event.target.value })
                  }
                />
                <div className="col-span-2 flex items-end justify-between gap-3 lg:col-span-1 lg:justify-end">
                  <label className="mb-3 inline-flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={size.is_available}
                      onChange={(event) =>
                        updateSize(size.key, {
                          is_available: event.target.checked,
                        })
                      }
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    Активний
                  </label>
                  <button
                    type="button"
                    aria-label={`Прибрати розмір ${size.size}`.trim()}
                    onClick={() =>
                      onChange({
                        sizes: sizes.filter((other) => other.key !== size.key),
                      })
                    }
                    className="mb-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
