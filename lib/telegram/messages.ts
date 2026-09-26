import { getCountryName } from "@/lib/constants/countries";
import type { OrderStatus } from "@/lib/constants/order";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/order-labels";
import { formatPrice } from "@/lib/utils/format";
import type { NotifiableOrder } from "@/types/order";

/**
 * Telegram message texts (HTML parse mode). Pure functions, so wording can
 * change without touching the sending logic. Everything that came from a
 * customer or admin goes through `escape`.
 */

export function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const money = (amount: number) => formatPrice(amount).replace(/\s/g, " ");

function orderLines(order: NotifiableOrder) {
  const items = order.items.map(
    (item) =>
      `• ${escape(item.productName)} — ${escape(item.color)}, ${escape(item.size)} × ${item.quantity} — ${money(item.subtotal)}`,
  );
  const country =
    order.deliveryCountryCode === "UA"
      ? ""
      : `, ${escape(getCountryName(order.deliveryCountryCode))}`;
  return [
    ...items,
    "",
    `Разом за товари: <b>${money(order.subtotal)}</b>`,
    `Доставка: ${DELIVERY_METHOD_LABELS[order.deliveryMethod]} · ${escape(order.deliveryAddress)}, ${escape(order.city)}${country}`,
    `Оплата: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
  ].join("\n");
}

function bankDetailsBlock(bankDetails: string) {
  return `\n\n<b>Реквізити для оплати</b>\n${escape(bankDetails)}\nУ призначенні платежу вкажіть: замовлення №`;
}

/** Whether the customer should see the bank details now. */
export function needsBankDetails(order: NotifiableOrder) {
  return (
    order.paymentMethod === "bank_transfer" &&
    order.paymentStatus !== "paid" &&
    (order.status === "confirmed" || order.status === "payment_pending")
  );
}

export function customerLinkedMessage(
  order: NotifiableOrder,
  bankDetails: string,
) {
  const intro =
    order.status === "new"
      ? "Ми отримали ваше замовлення й зателефонуємо, щоб його підтвердити. Тут ви отримуватимете оновлення статусу."
      : `Статус: ${STATUS_TEXT[order.status] ?? order.status}`;
  const details =
    bankDetails && needsBankDetails(order)
      ? bankDetailsBlock(bankDetails) + order.orderNumber
      : "";
  return `<b>Дякуємо, ${escape(order.firstName)}! Замовлення №${order.orderNumber}</b>\n${intro}\n\n${orderLines(order)}${details}`;
}

const STATUS_TEXT: Partial<Record<OrderStatus, string>> = {
  confirmed: "Замовлення підтверджено ✅",
  payment_pending: "Очікуємо на оплату.",
  paid: "Оплату отримано, дякуємо!",
  processing: "Готуємо замовлення до відправки.",
  shipped: "Замовлення відправлено 🚚",
  delivered: "Замовлення доставлено. Дякуємо, що обрали PONTOS!",
  cancelled:
    "Замовлення скасовано. Якщо це помилка — напишіть або зателефонуйте нам.",
};

/**
 * The customer's update after an admin change, or null when the change is
 * not worth a message (e.g. back to "new").
 */
export function statusChangedMessage(
  order: NotifiableOrder,
  changed: { status: boolean; paymentStatus: boolean },
  bankDetails: string,
): string | null {
  let text: string | undefined;
  if (changed.status) text = STATUS_TEXT[order.status];
  if (!text && changed.paymentStatus && order.paymentStatus === "paid") {
    text = STATUS_TEXT.paid;
  }
  if (!text) return null;
  const details =
    changed.status && bankDetails && needsBankDetails(order)
      ? bankDetailsBlock(bankDetails) + order.orderNumber
      : "";
  return `<b>Замовлення №${order.orderNumber}</b>\n${text}${details}`;
}

/** The owner's order card: the alert plus a live status line. */
export function ownerOrderMessage(order: NotifiableOrder, note?: string) {
  const status = `\n\n<b>Статус:</b> ${ORDER_STATUS_LABELS[order.status]} · ${PAYMENT_STATUS_LABELS[order.paymentStatus]}`;
  return (
    ownerNewOrderMessage(order) +
    status +
    (note ? `\n<i>${escape(note)}</i>` : "")
  );
}

export function ownerNewOrderMessage(order: NotifiableOrder) {
  const comment = order.comment ? `\nКоментар: ${escape(order.comment)}` : "";
  return `🛍 <b>Нове замовлення №${order.orderNumber}</b>\n${escape(order.firstName)} ${escape(order.lastName)} · ${escape(order.phone)}${comment}\n\n${orderLines(order)}`;
}

export const WELCOME_MESSAGE =
  "Вітаємо в PONTOS! 👋\nЦей бот надсилає підтвердження та статус замовлень. Щоб підключити замовлення, натисніть кнопку «Отримати підтвердження в Telegram» після оформлення на сайті.";

export const ORDER_LINK_INVALID =
  "Не вдалося знайти це замовлення. Відкрийте посилання з сайту ще раз або зв’яжіться з нами.";

export const ORDER_LINK_TAKEN =
  "Це замовлення вже підключене до іншого чату. Якщо це ваше замовлення — зв’яжіться з нами.";

export const OWNER_CONNECTED =
  "✅ Цей чат підключено до сповіщень про нові замовлення PONTOS.";

export const OWNER_LINK_INVALID =
  "Посилання для підключення застаріло. Створіть нове в адмінпанелі.";

export function helpMessage(phone: string) {
  return phone
    ? `Питання щодо замовлення? Зателефонуйте нам: ${escape(phone)}`
    : "Питання щодо замовлення? Напишіть нам через сайт — кнопка «Контакти».";
}
