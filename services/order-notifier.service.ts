import { randomBytes } from "node:crypto";
import type { OrderStatus, PaymentStatus } from "@/lib/constants/order";
import { ORDER_STATUS_LABELS } from "@/lib/constants/order-labels";
import type { InlineButton, TelegramBot } from "@/lib/telegram/bot";
import {
  customerLinkedMessage,
  helpMessage,
  ORDER_LINK_INVALID,
  ORDER_LINK_TAKEN,
  OWNER_CONNECTED,
  OWNER_LINK_INVALID,
  ownerOrderMessage,
  statusChangedMessage,
  WELCOME_MESSAGE,
} from "@/lib/telegram/messages";
import {
  availableActions,
  callbackData,
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
    "getStoreInfo" | "getTelegramSettings" | "saveTelegramSettings"
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

  async function linkOrder(chatId: number, hexToken: string) {
    const token = expandToken(hexToken);
    const order = token ? await orders.findByToken(token) : null;
    if (!order) return bot.sendMessage(chatId, ORDER_LINK_INVALID);
    if (order.telegramChatId !== null && order.telegramChatId !== chatId) {
      return bot.sendMessage(chatId, ORDER_LINK_TAKEN);
    }
    if (order.telegramChatId === null) {
      await orders.setTelegramChat(order.id, chatId);
    }
    const { bankDetails } = await seller();
    await bot.sendMessage(chatId, customerLinkedMessage(order, bankDetails));
  }

  /** Tells a subscribed customer what changed. `previous` is before the update. */
  async function notifyStatusChange(orderId: string, previous: Statuses) {
    const order = await orders.findById(orderId);
    if (!order?.telegramChatId) return;
    const changed = {
      status: order.status !== previous.status,
      paymentStatus: order.paymentStatus !== previous.paymentStatus,
    };
    if (!changed.status && !changed.paymentStatus) return;
    const { bankDetails } = await seller();
    const text = statusChangedMessage(order, changed, bankDetails);
    if (text) await bot.sendMessage(order.telegramChatId, text);
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

  const redraw = (
    chatId: number,
    messageId: number,
    order: NotifiableOrder,
    note?: string,
  ) =>
    bot.editMessage(
      chatId,
      messageId,
      ownerOrderMessage(order, note),
      ownerButtons(order),
    );

  async function applyOwnerAction(
    press: { id: string; chatId: number; messageId: number },
    order: NotifiableOrder,
    action: OrderAction,
  ) {
    if (!availableActions(order).includes(action)) {
      // Stale button: the status changed since this card was drawn.
      await redraw(press.chatId, press.messageId, order);
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

    await redraw(press.chatId, press.messageId, current, "Змінено в Telegram");
    await bot.answerCallback(
      press.id,
      `Готово: ${ORDER_STATUS_LABELS[current.status]}`,
    );
    // The customer hears about it exactly as if it changed on the site.
    await notifyStatusChange(order.id, previous);
  }

  async function handleOwnerPress(callback: ButtonPress) {
    const chatId = callback.message?.chat.id;
    const messageId = callback.message?.message_id;
    if (chatId === undefined || messageId === undefined) {
      return bot.answerCallback(callback.id);
    }
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
        await redraw(chatId, messageId, order);
        return bot.answerCallback(callback.id);
      }
      if (parsed.kind === "action" && parsed.action === "cancel") {
        // Cancelling asks for a second tap.
        await bot.editMessage(
          chatId,
          messageId,
          ownerOrderMessage(order, "Скасувати це замовлення?"),
          [
            [
              {
                text: "Так, скасувати",
                callbackData: callbackData.confirmCancel(order.id),
              },
              { text: "↩︎ Назад", callbackData: callbackData.back(order.id) },
            ],
          ],
        );
        return bot.answerCallback(callback.id);
      }
      const action =
        parsed.kind === "confirm-cancel" ? "cancel" : parsed.action;
      await applyOwnerAction(
        { id: callback.id, chatId, messageId },
        order,
        action,
      );
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
      const text = message?.text?.trim();
      if (!message || !text) return;
      const chatId = message.chat.id;
      const [command, payload = ""] = text.split(/\s+/, 2);

      if (command === "/start") {
        if (payload.startsWith(ORDER_START_PREFIX)) {
          return linkOrder(chatId, payload.slice(ORDER_START_PREFIX.length));
        }
        if (payload.startsWith(OWNER_START_PREFIX)) {
          return connectOwner(chatId, payload.slice(OWNER_START_PREFIX.length));
        }
        return bot.sendMessage(chatId, WELCOME_MESSAGE);
      }
      const { phone } = await seller();
      await bot.sendMessage(chatId, helpMessage(phone));
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
