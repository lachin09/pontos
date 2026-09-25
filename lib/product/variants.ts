import type { Product, ProductImage, ProductVariant } from "@/types/product";

/**
 * Pure product rules shared by the card, gallery, purchase panel and cart.
 * Colour names are typed by hand in the admin, so they are compared
 * ignoring case and surrounding spaces.
 */

export function sameColor(a: string | null | undefined, b: string) {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

/** One variant per colour, in the order they first appear. */
export function uniqueColors(variants: ProductVariant[]): ProductVariant[] {
  return Array.from(
    new Map(variants.map((variant) => [variant.color, variant])).values(),
  );
}

export function uniqueSizes(variants: ProductVariant[]): string[] {
  return Array.from(new Set(variants.map((variant) => variant.size)));
}

export function findVariant(
  variants: ProductVariant[],
  color: string,
  size: string,
): ProductVariant | undefined {
  return variants.find(
    (variant) => sameColor(variant.color, color) && variant.size === size,
  );
}

export function isInStock(
  variant: ProductVariant | undefined,
): variant is ProductVariant {
  return Boolean(variant?.isAvailable && variant.stock > 0);
}

/** The first variant a shopper can buy, or the first one at all. */
export function defaultVariant(variants: ProductVariant[]) {
  return variants.find((variant) => variant.isAvailable) ?? variants[0];
}

/**
 * The best size to show after switching colour: keep the current size if it
 * is in stock in the new colour, otherwise the first in-stock size.
 */
export function sizeForColor(
  variants: ProductVariant[],
  color: string,
  currentSize: string,
): string {
  if (isInStock(findVariant(variants, color, currentSize))) return currentSize;
  const inColor = variants.filter((variant) => sameColor(variant.color, color));
  return (inColor.find(isInStock) ?? inColor[0])?.size ?? currentSize;
}

const hasNoColor = (image: ProductImage) => !image.color?.trim();

/**
 * Photos to show for a colour: that colour's photos first, then the shared
 * ones. Falls back to every photo if nothing matches.
 */
export function imagesForColor(
  images: ProductImage[],
  color: string,
): ProductImage[] {
  if (!color) return images;
  const specific = images.filter((image) => sameColor(image.color, color));
  const shared = images.filter(hasNoColor);
  if (specific.length > 0) return [...specific, ...shared];
  return shared.length > 0 ? shared : images;
}

/** The thumbnail stored with a cart line for this colour. */
export function primaryImageUrl(product: Product, color: string) {
  return (
    product.images.find((image) => sameColor(image.color, color))?.url ??
    product.images.find(hasNoColor)?.url ??
    product.images[0]?.url ??
    null
  );
}

export function discountPercent(price: number, oldPrice: number | null) {
  return oldPrice ? Math.max(0, Math.round((1 - price / oldPrice) * 100)) : 0;
}
