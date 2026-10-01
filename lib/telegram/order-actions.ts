import type {
  CancelReason,
  OrderStatus,
  PaymentStatus,
} from "@/lib/constants/order";
import type { NotifiableOrder } from "@/types/order";

/**
 * Status buttons under the owner's order alerts. Pure rules: which actions an
 * order offers in its current state, and what each one changes. Adding an
 * action means adding an entry here.
 */

export type OrderAction = "confirm" | "paid" | "ship" | "deliver" | "cancel";

type Statuses = { status: OrderStatus; paymentStatus: PaymentStatus };

export const ORDER_ACTIONS: Record<
  OrderAction,
  { code: string; label: string; apply: (order: Statuses) => Statuses }
> = {
  confirm: {
    code: "c",
    label: "✅ Підтвердити",
    apply: (order) => ({
      status: "confirmed",
      paymentStatus: order.paymentStatus,
    }),
  },
  paid: {
    code: "p",
    label: "💰 Оплату отримано",
    apply: () => ({ status: "paid", paymentStatus: "paid" }),
  },
  ship: {
    code: "s",
    label: "📦 Відправлено",
    apply: (order) => ({
      status: "shipped",
      paymentStatus: order.paymentStatus,
    }),
  },
  deliver: {
    code: "d",
    label: "🏁 Доставлено",
    apply: (order) => ({
      status: "delivered",
      paymentStatus: order.paymentStatus,
    }),
  },
  cancel: {
    code: "x",
    label: "❌ Скасувати",
    apply: (order) => ({
      status: "cancelled",
      paymentStatus: order.paymentStatus,
    }),
  },
};

/**
 * "Out of stock" is offered as a cancel reason only before money changed
 * hands: its message to the customer says nothing about a refund.
 */
export const canCancelAsOutOfStock = (order: {
  paymentStatus: PaymentStatus;
}) => order.paymentStatus !== "paid";

const awaitingTransfer = (order: NotifiableOrder) =>
  order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid";

/** The next sensible steps for an order, in button order. */
export function availableActions(order: NotifiableOrder): OrderAction[] {
  switch (order.status) {
    case "new":
      return ["confirm", "cancel"];
    case "confirmed":
    case "payment_pending":
      // Transfers are shipped once paid; cash on delivery ships right away.
      return awaitingTransfer(order) ? ["paid", "cancel"] : ["ship", "cancel"];
    case "paid":
    case "processing":
      return ["ship", "cancel"];
    case "shipped":
      return ["deliver"];
    default:
      return [];
  }
}

/*
 * Callback data (Telegram allows 64 bytes): "o:<code>:<order id, 32 hex>".
 * Extra codes: "X" confirms a cancellation, "O" confirms it and tells the
 * customer the item is out of stock, "b" goes back to the normal buttons.
 */
export type OwnerCallback =
  | { kind: "action"; action: OrderAction; orderId: string }
  | { kind: "confirm-cancel"; orderId: string; reason: CancelReason | null }
  | { kind: "back"; orderId: string };

const compact = (uuid: string) => uuid.replace(/-/g, "");
const expand = (hex: string) =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

export const callbackData = {
  action: (action: OrderAction, orderId: string) =>
    `o:${ORDER_ACTIONS[action].code}:${compact(orderId)}`,
  confirmCancel: (orderId: string, reason: CancelReason | null = null) =>
    `o:${reason === "out_of_stock" ? "O" : "X"}:${compact(orderId)}`,
  back: (orderId: string) => `o:b:${compact(orderId)}`,
};

export function parseOwnerCallback(data: string): OwnerCallback | null {
  const match = /^o:([a-zA-Z]):([a-f0-9]{32})$/.exec(data);
  if (!match) return null;
  const [, code, hex] = match;
  const orderId = expand(hex);
  if (code === "X") return { kind: "confirm-cancel", orderId, reason: null };
  if (code === "O") {
    return { kind: "confirm-cancel", orderId, reason: "out_of_stock" };
  }
  if (code === "b") return { kind: "back", orderId };
  const action = (Object.keys(ORDER_ACTIONS) as OrderAction[]).find(
    (name) => ORDER_ACTIONS[name].code === code,
  );
  return action ? { kind: "action", action, orderId } : null;
}
