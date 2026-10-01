import { randomBytes } from "node:crypto";
import type {
  CancelReason,
  OrderStatus,
  PaymentStatus,
} from "@/lib/constants/order";
import type { Locale } from "@/lib/i18n/config";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-labels";
import type { InlineButton, TelegramBot } from "@/lib/telegram/bot";
import { localeFromTelegram } from "@/lib/telegram/customer-texts";
import {
  customerLinkedMessage,
  followButtons,
  followInvite,
  helpMessage,
  isPurchaseComplete,
  orderLinkInvalidMessage,
  orderLinkTakenMessage,
  OWNER_CONNECTED,
  OWNER_LINK_INVALID,
  ownerCustomerConnectedMessage,
  ownerOrderMessage,
  ownerReceiptMessage,
  receiptNoOrderMessage,
  receiptReceivedMessage,
  statusChangedMessage,
  welcomeMessage,
} from "@/lib/telegram/messages";
import {
  availableActions,
  callbackData,
  canCancelAsOutOfStock,
  ORDER_ACTIONS,
  parseOwnerCallback,
  type OrderAction,
} from "@/lib/telegram/order-actions";
import {
  ORDER_START_PREFIX,
  OWNER_START_PREFIX,
  type TelegramUpdate,
} from "@/lib/validators/telegram";
import type { OrderNotificationRepository } from "@/repositories/order.repository";
import type { SettingsService } from "@/services/settings.service";
import type { NotifiableOrder } from "@/types/order";

const MAX_OWNER_CHATS = 20;

type Statuses = { status: OrderStatus; paymentStatus: PaymentStatus };
type ButtonPress = NonNullable<TelegramUpdate["callback_query"]>;
type Message = NonNullable<TelegramUpdate["message"]>;

/** "0b6d3c54…" (32 hex) ⇄ "0b6d3c54-…" (UUID). Telegram start params can't hold dashes. */
const compactToken = (uuid: string) => uuid.replace(/-/g, "");
const expandToken = (hex: string) =>
  /^[a-f0-9]{32}$/i.test(hex)
    ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    : null;

export type OrderNotifier = ReturnType<typeof createOrderNotifier>;

/**
 * Order notifications over Telegram: the customer's confirmation and status
 * updates, bank details for transfers, and new-order cards with status
 * buttons for the owner.
 */
export function createOrderNotifier(deps: {
  orders: OrderNotificationRepository;
  settings: Pick<
    SettingsService,
    | "getStoreInfo"
    | "getTelegramSettings"
    | "saveTelegramSettings"
    | "getTelegramChannel"
    | "getContactLinks"
  >;
  bot: TelegramBot;
  /** e.g. "https://pontos-xi.vercel.app"; adds an admin link to owner cards. */
  siteUrl?: string | null;
  newCode?: () => string;
}) {
  const { orders, settings, bot, siteUrl } = deps;
  const newCode = deps.newCode ?? (() => randomBytes(16).toString("hex"));

  const startLink = async (payload: string) =>
    `https://t.me/${await bot.getUsername()}?start=${payload}`;

  const seller = async () => (await settings.getStoreInfo()).seller;

  // ── Customer ────────────────────────────────────────────────────────────

  async function linkOrder(chatId: number, hexToken: string, locale: Locale) {
    const token = expandToken(hexToken);
    const order = token ? await orders.findByToken(token) : null;
    if (!order) return bot.sendMessage(chatId, orderLinkInvalidMessage(locale));
    if (order.telegramChatId !== null && order.telegramChatId !== chatId) {
      return bot.sendMessage(chatId, orderLinkTakenMessage(order.locale));
    }
    const firstLink = order.telegramChatId === null;
    if (firstLink) {
      await orders.setTelegramChat(order.id, chatId);
    }
    const { bankDetails } = await seller();
    await bot.sendMessage(chatId, customerLinkedMessage(order, bankDetails));
    if (firstLink) await tellOwners(ownerCustomerConnectedMessage(order));
  }

  /** Plain notice to every owner chat; a blocked chat is logged, not fatal. */
  async function tellOwners(html: string) {
    const { ownerChatIds } = await settings.getTelegramSettings();
    const results = await Promise.allSettled(
      ownerChatIds.map((chatId) => bot.sendMessage(chatId, html)),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Owner Telegram notice failed", String(result.reason));
      }
    }
  }

  /** Where to follow the store; empty if that cannot be looked up right now. */
  async function followLinks(locale: Locale): Promise<InlineButton[][]> {
    try {
      const [channel, contactLinks] = await Promise.all([
        settings.getTelegramChannel(),
        settings.getContactLinks(),
      ]);
      return followButtons(channel, contactLinks, locale);
    } catch {
      return [];
    }
  }

  /**
   * Tells a subscribed customer what changed. `previous` is before the
   * update. A completed purchase also invites them to follow the store.
   */
  async function notifyStatusChange(
    orderId: string,
    previous: Statuses,
    cancelReason: CancelReason | null = null,
  ) {
    const order = await orders.findById(orderId);
    if (!order?.telegramChatId) return;
    const changed = {
      status: order.status !== previous.status,
      paymentStatus: order.paymentStatus !== previous.paymentStatus,
    };
    if (!changed.status && !changed.paymentStatus) return;
    const { bankDetails } = await seller();
    const text = statusChangedMessage(
      order,
      changed,
      bankDetails,
      cancelReason,
    );
    if (!text) return;
    const follow = isPurchaseComplete(order, changed)
      ? await followLinks(order.locale)
      : [];
    if (follow.length === 0) {
      await bot.sendMessage(order.telegramChatId, text);
      return;
    }
    await bot.sendMessage(
      order.telegramChatId,
      `${text}\n\n${followInvite(order.locale)}`,
      follow,
    );
  }

  /**
   * A photo or file from a customer is taken as the payment receipt for their
   * latest unpaid transfer order: it is copied to the owner chats with a
   * "paid" button, and the customer hears that it arrived.
   */
  async function receiveReceipt(message: Message, locale: Locale) {
    const chatId = message.chat.id;
    const order = await orders.findAwaitingPaymentByChat(chatId);
    if (!order) {
      const { phone } = await seller();
      return bot.sendMessage(chatId, receiptNoOrderMessage(locale, phone));
    }
    await orders.markReceiptSent(order.id);
    const current = (await orders.findById(order.id)) ?? order;
    const { ownerChatIds } = await settings.getTelegramSettings();
    const results = await Promise.allSettled(
      ownerChatIds.map((ownerChatId) =>
        bot.copyMessage(
          ownerChatId,
          chatId,
          message.message_id,
          ownerReceiptMessage(current),
          ownerButtons(current),
        ),
      ),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Owner receipt copy failed", String(result.reason));
      }
    }
    await bot.sendMessage(chatId, receiptReceivedMessage(current));
  }

  // ── Owner ───────────────────────────────────────────────────────────────

  async function connectOwner(chatId: number, code: string) {
    const current = await settings.getTelegramSettings();
    if (!current.connectCode || current.connectCode !== code) {
      return bot.sendMessage(chatId, OWNER_LINK_INVALID);
    }
    await settings.saveTelegramSettings({
      // Codes are single-use.
      connectCode: null,
      ownerChatIds: [...new Set([...current.ownerChatIds, chatId])].slice(
        -MAX_OWNER_CHATS,
      ),
    });
    await bot.sendMessage(chatId, OWNER_CONNECTED);
  }

  /** Status buttons two per row, then a link to the order in the admin. */
  function ownerButtons(order: NotifiableOrder): InlineButton[][] {
    const actions = availableActions(order).map((action) => ({
      text: ORDER_ACTIONS[action].label,
      callbackData: callbackData.action(action, order.id),
    }));
    const rows: InlineButton[][] = [];
    for (let i = 0; i < actions.length; i += 2) {
      rows.push(actions.slice(i, i + 2));
    }
    if (siteUrl) {
      rows.push([
        {
          text: "Відкрити в адмінці",
          url: `${siteUrl}/admin/orders/${order.id}`,
        },
      ]);
    }
    return rows;
  }

  type Card = { chatId: number; messageId: number; isReceipt: boolean };

  /** Re-renders an owner card: an order alert, or the caption under a receipt. */
  const redraw = (card: Card, order: NotifiableOrder, note?: string) =>
    card.isReceipt
      ? bot.editCaption(
          card.chatId,
          card.messageId,
          ownerReceiptMessage(order, note),
          ownerButtons(order),
        )
      : bot.editMessage(
          card.chatId,
          card.messageId,
          ownerOrderMessage(order, note),
          ownerButtons(order),
        );

  async function applyOwnerAction(
    press: { id: string } & Card,
    order: NotifiableOrder,
    action: OrderAction,
    cancelReason: CancelReason | null = null,
  ) {
    if (!availableActions(order).includes(action)) {
      // Stale button: the status changed since this card was drawn.
      await redraw(press, order);
      return bot.answerCallback(
        press.id,
        `Статус уже змінено: ${ORDER_STATUS_LABELS[order.status]}`,
      );
    }
    const previous = {
      status: order.status,
      paymentStatus: order.paymentStatus,
    };
    const updated = await orders.updateStatusFromTelegram(
      order.id,
      ORDER_ACTIONS[action].apply(order),
      press.chatId,
    );
    const current = updated ? await orders.findById(order.id) : null;
    if (!current) return bot.answerCallback(press.id, "Замовлення не знайдено");

    await redraw(
      press,
      current,
      cancelReason === "out_of_stock"
        ? "Скасовано в Telegram: немає в наявності"
        : "Змінено в Telegram",
    );
    await bot.answerCallback(
      press.id,
      `Готово: ${ORDER_STATUS_LABELS[current.status]}`,
    );
    // The customer hears about it exactly as if it changed on the site.
    await notifyStatusChange(order.id, previous, cancelReason);
  }

  async function handleOwnerPress(callback: ButtonPress) {
    const chatId = callback.message?.chat.id;
    const messageId = callback.message?.message_id;
    if (chatId === undefined || messageId === undefined) {
      return bot.answerCallback(callback.id);
    }
    const card: Card = {
      chatId,
      messageId,
      isReceipt: Boolean(callback.message?.photo || callback.message?.document),
    };
    const { ownerChatIds } = await settings.getTelegramSettings();
    if (!ownerChatIds.includes(chatId)) {
      return bot.answerCallback(callback.id, "Немає доступу");
    }
    const parsed = parseOwnerCallback(callback.data ?? "");
    const order = parsed ? await orders.findById(parsed.orderId) : null;
    if (!parsed || !order) {
      return bot.answerCallback(callback.id, "Замовлення не знайдено");
    }

    try {
      if (parsed.kind === "back") {
        await redraw(card, order);
        return bot.answerCallback(callback.id);
      }
      if (parsed.kind === "action" && parsed.action === "cancel") {
        // Cancelling asks for a second tap, which also picks what the
        // customer is told.
        const back = {
          text: "↩︎ Назад",
          callbackData: callbackData.back(order.id),
        };
        const withReason = canCancelAsOutOfStock(order);
        const buttons = withReason
          ? [
              [
                {
                  text: "Немає в наявності",
                  callbackData: callbackData.confirmCancel(
                    order.id,
                    "out_of_stock",
                  ),
                },
                {
                  text: "Інша причина",
                  callbackData: callbackData.confirmCancel(order.id),
                },
              ],
              [back],
            ]
          : [
              [
                {
                  text: "Так, скасувати",
                  callbackData: callbackData.confirmCancel(order.id),
                },
                back,
              ],
            ];
        const question = withReason
          ? "Скасувати це замовлення? Оберіть причину — її побачить покупець."
          : "Скасувати це замовлення?";
        await (card.isReceipt
          ? bot.editCaption(
              chatId,
              messageId,
              ownerReceiptMessage(order, question),
              buttons,
            )
          : bot.editMessage(
              chatId,
              messageId,
              ownerOrderMessage(order, question),
              buttons,
            ));
        return bot.answerCallback(callback.id);
      }
      if (parsed.kind === "confirm-cancel") {
        // An old "out of stock" button on an order paid since then.
        const reason = canCancelAsOutOfStock(order) ? parsed.reason : null;
        await applyOwnerAction(
          { id: callback.id, ...card },
          order,
          "cancel",
          reason,
        );
      } else {
        await applyOwnerAction(
          { id: callback.id, ...card },
          order,
          parsed.action,
        );
      }
    } catch (error) {
      console.error(
        "Telegram owner action failed",
        error instanceof Error ? error.message : error,
      );
      await bot.answerCallback(
        callback.id,
        "Не вдалося змінити статус. Спробуйте в адмінці.",
      );
    }
  }

  return {
    /** The t.me link that subscribes a customer's chat to this order. */
    async orderLink(orderNumber: number): Promise<string | null> {
      const order = await orders.findByNumber(orderNumber);
      return order
        ? startLink(ORDER_START_PREFIX + compactToken(order.publicToken))
        : null;
    },

    /** Sends every owner chat the new order with status buttons. */
    async notifyNewOrder(orderNumber: number) {
      const { ownerChatIds } = await settings.getTelegramSettings();
      if (ownerChatIds.length === 0) return;
      const order = await orders.findByNumber(orderNumber);
      if (!order) return;
      const results = await Promise.allSettled(
        ownerChatIds.map((chatId) =>
          bot.sendMessage(
            chatId,
            ownerOrderMessage(order),
            ownerButtons(order),
          ),
        ),
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Owner Telegram alert failed", String(result.reason));
        }
      }
    },

    notifyStatusChange,

    /** Reacts to a message or button press sent to the bot (via the webhook). */
    async handleUpdate(update: TelegramUpdate) {
      if (update.callback_query) return handleOwnerPress(update.callback_query);
      const message = update.message;
      if (!message) return;
      const chatId = message.chat.id;
      // Without an order to go by, the customer's Telegram language decides.
      const locale = localeFromTelegram(message.from?.language_code);

      if (message.photo || message.document) {
        return receiveReceipt(message, locale);
      }
      const text = message.text?.trim();
      if (!text) return;
      const [command, payload = ""] = text.split(/\s+/, 2);

      if (command === "/start") {
        if (payload.startsWith(ORDER_START_PREFIX)) {
          return linkOrder(
            chatId,
            payload.slice(ORDER_START_PREFIX.length),
            locale,
          );
        }
        if (payload.startsWith(OWNER_START_PREFIX)) {
          return connectOwner(chatId, payload.slice(OWNER_START_PREFIX.length));
        }
        return bot.sendMessage(chatId, welcomeMessage(locale));
      }
      const { phone } = await seller();
      await bot.sendMessage(chatId, helpMessage(phone, locale));
    },

    /** A single-use link the owner opens to receive new-order cards. */
    async createOwnerConnectLink() {
      const code = newCode();
      const current = await settings.getTelegramSettings();
      await settings.saveTelegramSettings({ ...current, connectCode: code });
      return startLink(OWNER_START_PREFIX + code);
    },

    async disconnectOwners() {
      await settings.saveTelegramSettings({
        ownerChatIds: [],
        connectCode: null,
      });
    },
  };
}
