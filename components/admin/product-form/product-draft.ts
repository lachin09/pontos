import {
  CONTENT_LOCALES,
  PRODUCT_TEXT_FIELDS,
  type Translations,
  type ProductTextField,
} from "@/lib/i18n/content";
import { compareSizes, sameSize } from "@/lib/product/sizes";
import type { AdminProductInput } from "@/lib/validators/admin-product";
import type {
  ProductCategoryOption,
  ProductColorDraft,
  ProductDraft,
  ProductSizeDraft,
  ProductVariantDraft,
} from "@/components/admin/product-form/types";

/** Pure helpers for creating product drafts and turning them into API input. */

/** Editable RU/EN fields, filled from what is saved (missing = empty). */
export function translationsDraft(
  saved: Translations<ProductTextField> = {},
): ProductDraft["translations"] {
  const draft = {} as ProductDraft["translations"];
  for (const locale of CONTENT_LOCALES) {
    draft[locale] = Object.fromEntries(
      PRODUCT_TEXT_FIELDS.map((field) => [field, saved[locale]?.[field] ?? ""]),
    ) as Record<ProductTextField, string>;
  }
  return draft;
}

/** Drops empty fields so the storefront falls back to Ukrainian for them. */
function translationsInput(
  draft: ProductDraft["translations"],
): AdminProductInput["translations"] {
  const input: AdminProductInput["translations"] = {};
  for (const locale of CONTENT_LOCALES) {
    const fields = Object.fromEntries(
      PRODUCT_TEXT_FIELDS.map((field) => [
        field,
        draft[locale][field].trim(),
      ]).filter(([, value]) => value),
    );
    if (Object.keys(fields).length > 0) input[locale] = fields;
  }
  return input;
}

export function newSize(size: string, price = ""): ProductSizeDraft {
  const key = crypto.randomUUID();
  return {
    key,
    sku: `PT-${key.slice(0, 8).toUpperCase()}`,
    size,
    price,
    stock: "0",
    is_available: true,
  };
}

export function newColor(): ProductColorDraft {
  return {
    key: crypto.randomUUID(),
    color: "",
    color_hex: "#222222",
    sizes: [],
  };
}

const bySize = (a: ProductSizeDraft, b: ProductSizeDraft) =>
  compareSizes(a.size, b.size);

/** Saved variants grouped by colour, in the order the colours first appear. */
export function colorsDraft(
  variants: ProductVariantDraft[],
): ProductColorDraft[] {
  const colors = new Map<string, ProductColorDraft>();
  for (const { color, color_hex, ...size } of variants) {
    const name = color.trim().toLowerCase();
    const group = colors.get(name) ?? { ...newColor(), color, color_hex };
    colors.set(name, group);
    group.sizes.push({ ...size, key: size.id ?? crypto.randomUUID() });
  }
  return Array.from(colors.values(), (group) => ({
    ...group,
    sizes: group.sizes.sort(bySize),
  }));
}

export function hasSize(sizes: ProductSizeDraft[], label: string) {
  return sizes.some((size) => sameSize(size.size, label));
}

/** Adds the sizes the colour does not have yet, keeping them in size order. */
export function addSizes(
  sizes: ProductSizeDraft[],
  labels: string[],
  price: string,
): ProductSizeDraft[] {
  const added = labels
    .filter((label) => label && !hasSize(sizes, label))
    .map((label) => newSize(label, price));
  return added.length > 0 ? [...sizes, ...added].sort(bySize) : sizes;
}

export function removeSize(sizes: ProductSizeDraft[], label: string) {
  return sizes.filter((size) => !sameSize(size.size, label));
}

export function initialDraft(
  categories: ProductCategoryOption[],
): ProductDraft {
  return {
    category_id: categories[0]?.id ?? "",
    name: "",
    slug: "",
    description: "",
    composition: "",
    care_instructions: "",
    price: "",
    old_price: "",
    is_published: false,
    is_available: true,
    is_featured: false,
    is_new: false,
    is_sale: false,
    translations: translationsDraft(),
    colors: [newColor()],
  };
}

export function toProductInput(draft: ProductDraft): AdminProductInput {
  return {
    category_id: draft.category_id,
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    description: draft.description.trim(),
    composition: draft.composition.trim(),
    care_instructions: draft.care_instructions.trim(),
    price: Number(draft.price),
    old_price: draft.old_price === "" ? null : Number(draft.old_price),
    is_published: draft.is_published,
    is_available: draft.is_available,
    is_featured: draft.is_featured,
    is_new: draft.is_new,
    is_sale: draft.is_sale,
    translations: translationsInput(draft.translations),
    variants: draft.colors.flatMap((color) =>
      color.sizes.map((size) => ({
        ...(size.id ? { id: size.id } : {}),
        sku: size.sku.trim(),
        size: size.size.trim(),
        color: color.color.trim(),
        color_hex: color.color_hex,
        price: Number(size.price),
        stock: Number(size.stock),
        is_available: size.is_available,
      })),
    ),
  };
}

/** Distinct, non-empty variant colours an image can be tagged with. */
export function variantColors(colors: ProductColorDraft[]) {
  return Array.from(
    new Set(colors.map((color) => color.color.trim()).filter(Boolean)),
  );
}
