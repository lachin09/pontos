import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/constants/order";

export interface PlacedOrder {
  orderNumber: number;
  total: number;
  paymentStatus: PaymentStatus;
  /** False when the idempotency key matched an order that already exists. */
  wasCreated: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  size: string;
  color: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusChange {
  id: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  oldPaymentStatus: PaymentStatus;
  newPaymentStatus: PaymentStatus;
  createdAt: string;
}

export interface OrderDetails {
  id: string;
  orderNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  deliveryCountryCode: string;
  deliveryPostalCode: string | null;
  novaPoshtaDivisionId: number | null;
  novaPoshtaDivisionName: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  comment: string | null;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  history: OrderStatusChange[];
}

/** What the Telegram messages need to know about an order. */
export interface NotifiableOrder {
  id: string;
  orderNumber: number;
  publicToken: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  deliveryCountryCode: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  comment: string | null;
  subtotal: number;
  telegramChatId: number | null;
  items: Pick<
    OrderItem,
    "productName" | "size" | "color" | "quantity" | "subtotal"
  >[];
}
