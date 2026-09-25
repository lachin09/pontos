import type { AdminProductInput } from "@/lib/validators/admin-product";
import type {
  ProductCategoryOption,
  ProductDraft,
  ProductVariantDraft,
} from "@/components/admin/product-form/types";

/** Pure helpers for creating product drafts and turning them into API input. */

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
