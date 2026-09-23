import type { Order, OrderItem } from "@/types/order";
import { mockProducts } from "@/mocks/products";

const productBySlug = new Map(
  mockProducts.map((product) => [product.slug, product]),
);

interface OrderItemSeed {
  slug: string;
  variantIndex?: number;
  quantity: number;
}

interface OrderSeed extends Omit<Order, "items" | "subtotal" | "total"> {
  itemSeeds: OrderItemSeed[];
}

function createOrder(seed: OrderSeed): Order {
  const { itemSeeds, ...orderFields } = seed;
  const items: OrderItem[] = itemSeeds.map(
    ({ slug, variantIndex = 0, quantity }, index) => {
      const product = productBySlug.get(slug);
      if (!product)
        throw new Error(`Mock order references unknown product: ${slug}`);
      const variant = product.variants[variantIndex];
      if (!variant)
        throw new Error(
          `Mock order references unknown variant: ${slug} (${variantIndex})`,
        );

      return {
        id: `${seed.id}-item-${index + 1}`,
        orderId: seed.id,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        productImage: product.images[0]?.url ?? null,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        quantity,
        subtotal: variant.price * quantity,
      };
    },
  );
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  return {
    ...orderFields,
    items,
    subtotal,
    total: subtotal + seed.deliveryPrice,
  };
}

const orderSeeds: OrderSeed[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    orderNumber: "#1025",
    firstName: "Олена",
    lastName: "Коваль",
    phone: "+380501234567",
    city: "Київ",
    deliveryMethod: "nova_poshta",
    deliveryAddress: "Відділення № 18",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    status: "new",
    comment: null,
    deliveryPrice: 80,
    createdAt: "2025-08-21T10:12:00.000Z",
    updatedAt: "2025-08-21T10:12:00.000Z",
    itemSeeds: [{ slug: "daily-t-shirt", quantity: 2 }],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    orderNumber: "#1024",
    firstName: "Андрій",
    lastName: "Мельник",
    phone: "+380671234568",
    city: "Львів",
    deliveryMethod: "ukrposhta",
    deliveryAddress: "Відділення № 7",
    paymentMethod: "bank_transfer",
    paymentStatus: "awaiting_confirmation",
    status: "confirmed",
    comment: "Зателефонуйте після 18:00.",
    deliveryPrice: 70,
    createdAt: "2025-08-20T15:30:00.000Z",
    updatedAt: "2025-08-20T16:00:00.000Z",
    itemSeeds: [
      { slug: "weekend-sweatshirt", quantity: 1 },
      { slug: "everyday-cap", quantity: 1 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    orderNumber: "#1023",
    firstName: "Марія",
    lastName: "Шевченко",
    phone: "+380931234569",
    city: "Одеса",
    deliveryMethod: "nova_poshta",
    deliveryAddress: "Відділення № 3",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    status: "payment_pending",
    comment: null,
    deliveryPrice: 80,
    createdAt: "2025-08-19T12:05:00.000Z",
    updatedAt: "2025-08-19T12:15:00.000Z",
    itemSeeds: [{ slug: "utility-jacket", quantity: 1 }],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    orderNumber: "#1022",
    firstName: "Ігор",
    lastName: "Бондар",
    phone: "+380991234560",
    city: "Дніпро",
    deliveryMethod: "courier",
    deliveryAddress: "проспект Дмитра Яворницького, 12",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "cash_on_delivery",
    status: "processing",
    comment: null,
    deliveryPrice: 120,
    createdAt: "2025-08-18T09:45:00.000Z",
    updatedAt: "2025-08-18T11:20:00.000Z",
    itemSeeds: [
      { slug: "straight-trousers", quantity: 1 },
      { slug: "canvas-tote-bag", quantity: 1 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    orderNumber: "#1021",
    firstName: "Софія",
    lastName: "Романюк",
    phone: "+380631234561",
    city: "Харків",
    deliveryMethod: "nova_poshta",
    deliveryAddress: "Відділення № 11",
    paymentMethod: "cash_on_delivery",
    paymentStatus: "paid",
    status: "delivered",
    comment: null,
    deliveryPrice: 80,
    createdAt: "2025-08-15T14:00:00.000Z",
    updatedAt: "2025-08-19T13:10:00.000Z",
    itemSeeds: [{ slug: "linen-blend-shirt", quantity: 1 }],
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    orderNumber: "#1020",
    firstName: "Тарас",
    lastName: "Литвин",
    phone: "+380681234562",
    city: "Вінниця",
    deliveryMethod: "ukrposhta",
    deliveryAddress: "Відділення № 4",
    paymentMethod: "bank_transfer",
    paymentStatus: "failed",
    status: "cancelled",
    comment: null,
    deliveryPrice: 70,
    createdAt: "2025-08-12T11:00:00.000Z",
    updatedAt: "2025-08-13T10:00:00.000Z",
    itemSeeds: [{ slug: "rib-knit-dress", quantity: 1 }],
  },
];

export const mockOrders: Order[] = orderSeeds.map(createOrder);
