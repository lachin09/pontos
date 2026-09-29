import type { ProductTextField, Translations } from "@/lib/i18n/content";

export interface ProductImage {
  id: string;
  productId: string;
  color: string | null;
  url: string;
  alt: string;
  sortOrder: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  composition: string;
  careInstructions: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  /** Russian / English text; Ukrainian is in the fields above. */
  translations: Translations<ProductTextField>;
  createdAt: string;
  updatedAt: string;
}
