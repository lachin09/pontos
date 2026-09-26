import type { NotifiableOrder } from "@/types/order";
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

export function makeNotifiableOrder(
  overrides: Partial<NotifiableOrder> = {},
): NotifiableOrder {
  return {
    id: "3f2b1c9e-0000-4000-8000-000000000001",
    orderNumber: 1042,
    publicToken: "0b6d3c54-9f7e-4c1a-8e39-2f0c1d7a5b11",
    firstName: "Олена",
    lastName: "Коваль",
    phone: "+380971234567",
    city: "Київ",
    deliveryCountryCode: "UA",
    deliveryMethod: "nova_poshta",
    deliveryAddress: "Відділення №12",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    status: "new",
    comment: null,
    subtotal: 3000,
    telegramChatId: null,
    items: [
      {
        productName: "Пальто",
        size: "M",
        color: "Чорний",
        quantity: 1,
        subtotal: 3000,
      },
    ],
    ...overrides,
  };
}
