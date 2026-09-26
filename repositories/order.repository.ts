import type { OrderStatus, PaymentStatus } from "@/lib/constants/order";
import type { CreateOrderInput } from "@/lib/validators/order";
import type {
  NotifiableOrder,
  OrderDetails,
  OrderSummary,
  PlacedOrder,
} from "@/types/order";

/** What checkout needs: placing an order. Nothing else. */
export interface OrderPlacementRepository {
  /**
   * Prices the cart and reserves stock atomically. Repeating a call with the
   * same idempotency key returns the original order.
   */
  place(order: CreateOrderInput, idempotencyKey: string): Promise<PlacedOrder>;
}

/** What the admin area needs: reviewing orders and moving them along. */
export interface OrderAdminRepository {
  list(limit: number): Promise<OrderSummary[]>;
  getStatuses(
    id: string,
  ): Promise<{ status: OrderStatus; paymentStatus: PaymentStatus } | null>;
  getDetails(id: string): Promise<OrderDetails | null>;
  /** Returns false when the order does not exist. */
  updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
  ): Promise<boolean>;
}

/** Order data for customer and owner notifications (service role only). */
export interface OrderNotificationRepository {
  findById(id: string): Promise<NotifiableOrder | null>;
  findByNumber(orderNumber: number): Promise<NotifiableOrder | null>;
  /** `token` is the order's public token (a UUID). */
  findByToken(token: string): Promise<NotifiableOrder | null>;
  setTelegramChat(orderId: string, chatId: number): Promise<void>;
}
