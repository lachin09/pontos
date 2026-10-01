export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "payment_pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "awaiting_confirmation",
  "paid",
  "cash_on_delivery",
  "failed",
] as const;

export const PAYMENT_METHODS = ["bank_transfer", "cash_on_delivery"] as const;

export const DELIVERY_METHODS = [
  "nova_poshta",
  "ukrposhta",
  "courier",
] as const;

/** Why the store cancelled an order, when the customer should be told. */
export const CANCEL_REASONS = ["out_of_stock"] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
