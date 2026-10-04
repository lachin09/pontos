import { getCountryName } from "@/lib/constants/countries";
import type { CancelReason } from "@/lib/constants/order";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/order-labels";
import { resolveContactLinks } from "@/lib/content/contact-links";
import type { Locale } from "@/lib/i18n/config";
import { fill, getDictionary } from "@/lib/i18n/dictionaries";
import type { InlineButton } from "@/lib/telegram/bot";
import { customerTexts } from "@/lib/telegram/customer-texts";
import { formatPrice } from "@/lib/utils/format";
import type { ContactLinkRecord } from "@/lib/validators/contact-links";
import type { TelegramChannel } from "@/lib/validators/telegram";
import type { NotifiableOrder } from "@/types/order";

/**
 * Telegram message texts (HTML parse mode). Pure functions, so wording can
 * change without touching the sending logic. Everything that came from a
 * customer or admin goes through `escape`. Customer messages follow the
 * order's language; owner messages are Ukrainian.
 */

export function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const money = (amount: number) =>
  formatPrice(amount).replace(/\s/g, " ");

function orderLines(order: NotifiableOrder, locale: Locale = "uk") {
  const t = customerTexts(locale);
  const labels = getDictionary(locale).checkout;
  const items = order.items.map(
    (item) =>
      `• ${escape(item.productName)} — ${escape(item.color)}, ${escape(item.size)} × ${item.quantity} — ${money(item.subtotal)}`,
  );
  const country =
    order.deliveryCountryCode === "UA"
      ? ""
      : `, ${escape(getCountryName(order.deliveryCountryCode, locale))}`;
  const discount =
    order.discountAmount > 0
      ? [
          `${fill(t.discountFirst, { percent: String(order.discountPercent) })}: −${money(order.discountAmount)}`,
          `${t.toPay}: <b>${money(order.total)}</b>`,
        ]
      : [];
  return [
    ...items,
    "",
    `${t.itemsTotal}: <b>${money(order.subtotal)}</b>`,
    ...discount,
    `${t.delivery}: ${labels.deliveryMethods[order.deliveryMethod]} · ${escape(order.deliveryAddress)}, ${escape(order.city)}${country}`,
    `${t.payment}: ${labels.paymentMethods[order.paymentMethod]}`,
  ].join("\n");
}

/** Bank details plus how to reference the order and send the receipt. */
function bankDetailsBlock(order: NotifiableOrder, bankDetails: string) {
  const t = customerTexts(order.locale);
  const purpose = fill(t.bankPurpose, { number: order.orderNumber });
  return `\n\n<b>${t.bankTitle}</b>\n${escape(bankDetails)}\n${purpose}\n\n${t.receiptAsk}`;
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
  const t = customerTexts(order.locale);
  const intro =
    order.status === "new"
      ? t.introNew
      : `${t.status}: ${t.statuses[order.status] ?? ORDER_STATUS_LABELS[order.status]}`;
  const details =
    bankDetails && needsBankDetails(order)
      ? bankDetailsBlock(order, bankDetails)
      : "";
  const thanks = fill(t.thanks, {
    name: escape(order.firstName),
    number: order.orderNumber,
  });
  return `<b>${thanks}</b>\n${intro}\n\n${orderLines(order, order.locale)}${details}`;
}

/**
 * The customer's update after an admin change, or null when the change is
 * not worth a message (e.g. back to "new"). A cancellation explains itself
 * when the owner gave a reason.
 */
export function statusChangedMessage(
  order: NotifiableOrder,
  changed: { status: boolean; paymentStatus: boolean },
  bankDetails: string,
  cancelReason: CancelReason | null = null,
): string | null {
  const t = customerTexts(order.locale);
  let text: string | undefined;
  if (changed.status) {
    text =
      order.status === "cancelled" && cancelReason === "out_of_stock"
        ? t.cancelledOutOfStock
        : t.statuses[order.status];
  }
  if (!text && changed.paymentStatus && order.paymentStatus === "paid") {
    text = t.statuses.paid;
  }
  if (!text) return null;
  const details =
    changed.status && bankDetails && needsBankDetails(order)
      ? bankDetailsBlock(order, bankDetails)
      : "";
  return `<b>${orderTitle(order)}</b>\n${text}${details}`;
}

/**
 * The moment a purchase is complete: a transfer was paid, or a
 * cash-on-delivery order was delivered. Each happens once per order.
 */
export function isPurchaseComplete(
  order: NotifiableOrder,
  changed: { status: boolean; paymentStatus: boolean },
) {
  return order.paymentMethod === "bank_transfer"
    ? changed.paymentStatus && order.paymentStatus === "paid"
    : changed.status && order.status === "delivered";
}

/** The line that introduces the "follow us" buttons. */
export const followInvite = (locale: Locale) => customerTexts(locale).followUs;

/**
 * "Follow us" link buttons, two per row: the store's Telegram channel, then
 * the Instagram and TikTok profiles from the contact links.
 */
export function followButtons(
  channel: TelegramChannel,
  contactLinks: ContactLinkRecord[],
  locale: Locale,
): InlineButton[][] {
  const links = resolveContactLinks(contactLinks);
  const profile = (kind: "instagram" | "tiktok", text: string) => {
    const link = links.find((entry) => entry.kind === kind);
    return link ? [{ text, url: link.href }] : [];
  };
  const buttons: InlineButton[] = [
    ...(channel?.username
      ? [
          {
            text: customerTexts(locale).channelButton,
            url: `https://t.me/${channel.username}`,
          },
        ]
      : []),
    ...profile("instagram", "Instagram"),
    ...profile("tiktok", "TikTok"),
  ];
  const rows: InlineButton[][] = [];
  for (let i = 0; i < buttons.length; i += 2)
    rows.push(buttons.slice(i, i + 2));
  return rows;
}

/** "Замовлення №1042" in the customer's language, without the greeting. */
function orderTitle(order: NotifiableOrder) {
  const t = customerTexts(order.locale);
  return fill(t.thanks, { name: "", number: order.orderNumber }).replace(
    /^[^!]*!\s*/,
    "",
  );
}

/** After a customer sent a photo or file: did it reach an order? */
export function receiptReceivedMessage(order: NotifiableOrder) {
  const t = customerTexts(order.locale);
  return `<b>${orderTitle(order)}</b>\n${t.receiptReceived}`;
}

export function receiptNoOrderMessage(locale: Locale, phone: string) {
  const t = customerTexts(locale);
  return phone
    ? fill(t.receiptNoOrder, { phone: escape(phone) })
    : t.helpNoPhone;
}

/** Caption for the receipt copied to the owner, with its live status line. */
export function ownerReceiptMessage(order: NotifiableOrder, note?: string) {
  const status = `\n\n<b>Статус:</b> ${ORDER_STATUS_LABELS[order.status]} · ${PAYMENT_STATUS_LABELS[order.paymentStatus]}`;
  return (
    `💳 <b>Квитанція до замовлення №${order.orderNumber}</b>\n${escape(order.firstName)} ${escape(order.lastName)} · ${escape(order.phone)}\nСума: <b>${money(order.total)}</b> · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}` +
    status +
    (note ? `\n<i>${escape(note)}</i>` : "")
  );
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

const CUSTOMER_LANGUAGE: Record<Locale, string> = {
  uk: "",
  ru: "\nМова клієнта: російська",
  en: "\nМова клієнта: англійська",
};

/** Whether status updates reach the customer, or the owner must phone them. */
export function ownerTelegramLine(order: NotifiableOrder) {
  return order.telegramChatId
    ? "Telegram: ✅ підключено, статуси надходять автоматично"
    : "Telegram: ❌ не підключено — зателефонуйте клієнту";
}

export function ownerNewOrderMessage(order: NotifiableOrder) {
  const comment = order.comment ? `\nКоментар: ${escape(order.comment)}` : "";
  return `🛍 <b>Нове замовлення №${order.orderNumber}</b>\n${escape(order.firstName)} ${escape(order.lastName)} · ${escape(order.phone)}${CUSTOMER_LANGUAGE[order.locale]}\n${ownerTelegramLine(order)}${comment}\n\n${orderLines(order)}`;
}

/** Owner alert when the customer connects their chat to an order. */
export function ownerCustomerConnectedMessage(order: NotifiableOrder) {
  return `📲 <b>Замовлення №${order.orderNumber}</b>\n${escape(order.firstName)} ${escape(order.lastName)} підключив(ла) Telegram — підтвердження та статуси надходитимуть автоматично.`;
}

export const welcomeMessage = (locale: Locale) => customerTexts(locale).welcome;

export const orderLinkInvalidMessage = (locale: Locale) =>
  customerTexts(locale).orderLinkInvalid;

export const orderLinkTakenMessage = (locale: Locale) =>
  customerTexts(locale).orderLinkTaken;

export const OWNER_CONNECTED =
  "✅ Цей чат підключено до сповіщень про нові замовлення PONTOS.";

export const OWNER_LINK_INVALID =
  "Посилання для підключення застаріло. Створіть нове в адмінпанелі.";

export function helpMessage(phone: string, locale: Locale = "uk") {
  const t = customerTexts(locale);
  return phone ? fill(t.help, { phone: escape(phone) }) : t.helpNoPhone;
}
