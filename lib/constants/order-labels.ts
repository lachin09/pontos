import type { DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/constants/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  confirmed: "Підтверджене",
  payment_pending: "Очікує оплати",
  paid: "Оплачене",
  processing: "В обробці",
  shipped: "Відправлене",
  delivered: "Доставлене",
  cancelled: "Скасоване",
};
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Очікує оплати",
  awaiting_confirmation: "Очікує підтвердження",
  paid: "Оплачене",
  cash_on_delivery: "Оплата при отриманні",
  failed: "Не пройшла",
};
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Переказ на рахунок",
  cash_on_delivery: "Оплата при отриманні",
};
export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  nova_poshta: "Нова пошта",
  ukrposhta: "Укрпошта",
  courier: "Кур’єр",
};
