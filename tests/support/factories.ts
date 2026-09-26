import type { Product, ProductImage, ProductVariant } from "@/types/product";

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

export function makeVariant(
  overrides: Partial<ProductVariant> = {},
): ProductVariant {
  return {
    id: nextId("variant"),
    productId: "product-1",
    sku: nextId("SKU"),
    size: "M",
    color: "Чорний",
    colorHex: "#111111",
    price: 1000,
    stock: 10,
    isAvailable: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeImage(overrides: Partial<ProductImage> = {}): ProductImage {
  const id = nextId("image");
  return {
    id,
    productId: "product-1",
    color: null,
    url: `https://cdn.example.com/${id}.jpg`,
    alt: "Фото товару",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: nextId("product"),
    name: "Пальто",
    slug: nextId("palto"),
    description: "Опис",
    composition: "Вовна",
    careInstructions: "Хімчистка",
    categoryId: "category-1",
    price: 1000,
    oldPrice: null,
    images: [makeImage()],
    variants: [makeVariant()],
    isAvailable: true,
    isFeatured: false,
    isNew: false,
    isSale: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
