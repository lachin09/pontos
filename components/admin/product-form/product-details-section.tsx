"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateProductField } from "@/components/admin/product-form/use-product-draft";
import type {
  ProductCategoryOption,
  ProductDraft,
} from "@/components/admin/product-form/types";

interface ProductDetailsSectionProps {
  categories: ProductCategoryOption[];
  draft: ProductDraft;
  update: UpdateProductField;
  onNameChange: (name: string) => void;
  onPriceChange: (price: string) => void;
  onSlugBlur: () => void;
}

/** Basic info, pricing and storefront flags of a product. */
export function ProductDetailsSection({
  categories,
  draft,
  update,
  onNameChange,
  onPriceChange,
  onSlugBlur,
}: ProductDetailsSectionProps) {
  return (
    <section className="grid gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2 sm:p-7">
      <h2 className="text-lg font-medium sm:col-span-2">Основна інформація</h2>
      <Input
        id="product-name"
        label="Назва товару"
        required
        maxLength={200}
        value={draft.name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <Input
        id="product-slug"
        label="Посилання (slug)"
        required
        maxLength={200}
        hint="Латинські літери, цифри та дефіси"
        value={draft.slug}
        onChange={(event) => update("slug", event.target.value.toLowerCase())}
        onBlur={onSlugBlur}
      />
      <div className="grid gap-1.5">
        <label htmlFor="product-category" className="text-sm font-medium">
          Категорія
        </label>
        <select
          id="product-category"
          required
          value={draft.category_id}
          onChange={(event) => update("category_id", event.target.value)}
          className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm focus:border-focus focus:outline-none"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <Input
        id="product-price"
        label="Основна ціна / від, ₴"
        type="number"
        min="0"
        step="0.01"
        required
        value={draft.price}
        onChange={(event) => onPriceChange(event.target.value)}
      />
      <Input
        id="product-old-price"
        label="Стара ціна, ₴"
        type="number"
        min="0"
        step="0.01"
        value={draft.old_price}
        onChange={(event) => update("old_price", event.target.value)}
        hint="Залиште порожнім, якщо знижки немає"
      />
      <Textarea
        id="product-description"
        label="Опис"
        className="sm:col-span-2"
        maxLength={10000}
        value={draft.description}
        onChange={(event) => update("description", event.target.value)}
      />
      <Textarea
        id="product-composition"
        label="Склад"
        maxLength={2000}
        value={draft.composition}
        onChange={(event) => update("composition", event.target.value)}
      />
      <Textarea
        id="product-care"
        label="Догляд"
        maxLength={2000}
        value={draft.care_instructions}
        onChange={(event) => update("care_instructions", event.target.value)}
      />
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <Toggle
          label="Опублікувати в магазині"
          checked={draft.is_published}
          onChange={(checked) => update("is_published", checked)}
        />
        <Toggle
          label="Товар доступний для замовлення"
          checked={draft.is_available}
          onChange={(checked) => update("is_available", checked)}
        />
        <Toggle
          label="Позначити як новинку"
          checked={draft.is_new}
          onChange={(checked) => update("is_new", checked)}
        />
        <Toggle
          label="Показувати серед рекомендованих"
          checked={draft.is_featured}
          onChange={(checked) => update("is_featured", checked)}
        />
        <Toggle
          label="Позначити як акційний товар"
          checked={draft.is_sale}
          onChange={(checked) => update("is_sale", checked)}
        />
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-10 items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}
