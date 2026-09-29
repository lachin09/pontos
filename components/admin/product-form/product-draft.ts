import {
  CONTENT_LOCALES,
  PRODUCT_TEXT_FIELDS,
  type Translations,
  type ProductTextField,
} from "@/lib/i18n/content";
import type { AdminProductInput } from "@/lib/validators/admin-product";
import type {
  ProductCategoryOption,
  ProductDraft,
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

export function newVariant(price = ""): ProductVariantDraft {
  return {
    sku: `PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    size: "",
    color: "",
    color_hex: "#222222",
    price,
    stock: "0",
    is_available: true,
  };
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
    variants: [newVariant()],
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
    variants: draft.variants.map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      sku: variant.sku.trim(),
      size: variant.size.trim(),
      color: variant.color.trim(),
      color_hex: variant.color_hex,
      price: Number(variant.price),
      stock: Number(variant.stock),
      is_available: variant.is_available,
    })),
  };
}

/** Distinct, non-empty variant colours an image can be tagged with. */
export function variantColors(variants: ProductVariantDraft[]) {
  return Array.from(
    new Set(variants.map((variant) => variant.color.trim()).filter(Boolean)),
  );
}
