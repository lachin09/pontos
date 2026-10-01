import type { ContentLocale, ProductTextField } from "@/lib/i18n/content";

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export interface ProductVariantDraft {
  id?: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price: string;
  stock: string;
  is_available: boolean;
}

/** One size of a colour; `key` only identifies the row in the form. */
export interface ProductSizeDraft extends Omit<
  ProductVariantDraft,
  "color" | "color_hex"
> {
  key: string;
}

/** A colour and the sizes it comes in; each size is saved as one variant. */
export interface ProductColorDraft {
  key: string;
  color: string;
  color_hex: string;
  sizes: ProductSizeDraft[];
}

export interface ProductImageDraft {
  id: string;
  url: string;
  alt: string;
  color: string | null;
  sortOrder: number;
}

/** A file picked in the browser that has not been uploaded yet. */
export interface NewProductImage {
  file: File;
  color: string | null;
}

export interface ProductDraft {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  composition: string;
  care_instructions: string;
  price: string;
  old_price: string;
  is_published: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  /** Russian and English text as typed; empty strings mean "use Ukrainian". */
  translations: Record<ContentLocale, Record<ProductTextField, string>>;
  colors: ProductColorDraft[];
}
