import type { Locale } from "@/lib/i18n/config";
import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/constants/order";

export interface PlacedOrder {
  orderNumber: number;
  subtotal: number;
  /** First-customer promotion: 0 when it did not apply. */
  discountPercent: number;
  discountAmount: number;
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
  /** Where the change was made: the admin site or the owner's Telegram. */
  changedVia: "admin" | "telegram";
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
  discountPercent: number;
  discountAmount: number;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  /** True when the customer connected the Telegram bot to this order. */
  telegramConnected: boolean;
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
  discountPercent: number;
  discountAmount: number;
  total: number;
  telegramChatId: number | null;
  /** The language the customer shopped in. */
  locale: Locale;
  items: Pick<
    OrderItem,
    "productName" | "size" | "color" | "quantity" | "subtotal"
  >[];
}
