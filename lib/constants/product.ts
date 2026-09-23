export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const PRODUCT_SORTS = [
  "featured",
  "price-asc",
  "price-desc",
  "newest",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];
