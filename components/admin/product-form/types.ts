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
  variants: ProductVariantDraft[];
}
