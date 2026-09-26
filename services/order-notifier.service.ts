import { randomBytes } from "node:crypto";
import type { OrderStatus, PaymentStatus } from "@/lib/constants/order";
import type { TelegramBot } from "@/lib/telegram/bot";
import {
  customerLinkedMessage,
  helpMessage,
  ORDER_LINK_INVALID,
  ORDER_LINK_TAKEN,
  OWNER_CONNECTED,
  OWNER_LINK_INVALID,
  ownerNewOrderMessage,
  statusChangedMessage,
  WELCOME_MESSAGE,
} from "@/lib/telegram/messages";
import {
  ORDER_START_PREFIX,
  OWNER_START_PREFIX,
  type TelegramUpdate,
} from "@/lib/validators/telegram";
import type { OrderNotificationRepository } from "@/repositories/order.repository";
import type { SettingsService } from "@/services/settings.service";

const MAX_OWNER_CHATS = 20;

type Statuses = { status: OrderStatus; paymentStatus: PaymentStatus };

/** "0b6d3c54…" (32 hex) ⇄ "0b6d3c54-…" (UUID). Telegram start params can't hold dashes. */
const compactToken = (uuid: string) => uuid.replace(/-/g, "");
const expandToken = (hex: string) =>
  /^[a-f0-9]{32}$/i.test(hex)
    ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    : null;

export type OrderNotifier = ReturnType<typeof createOrderNotifier>;

/**
 * Order notifications over Telegram: the customer's confirmation and status
 * updates, bank details for transfers, and new-order alerts for the owner.
 */
export function createOrderNotifier(deps: {
  orders: OrderNotificationRepository;
  settings: Pick<
    SettingsService,
    "getStoreInfo" | "getTelegramSettings" | "saveTelegramSettings"
  >;
  bot: TelegramBot;
  /** e.g. "https://pontos-xi.vercel.app"; adds an admin link to alerts. */
  siteUrl?: string | null;
  newCode?: () => string;
}) {
  const { orders, settings, bot, siteUrl } = deps;
  const newCode = deps.newCode ?? (() => randomBytes(16).toString("hex"));

  const startLink = async (payload: string) =>
    `https://t.me/${await bot.getUsername()}?start=${payload}`;

  const seller = async () => (await settings.getStoreInfo()).seller;

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

  return {
    /** The t.me link that subscribes a customer's chat to this order. */
    async orderLink(orderNumber: number): Promise<string | null> {
      const order = await orders.findByNumber(orderNumber);
      return order
        ? startLink(ORDER_START_PREFIX + compactToken(order.publicToken))
        : null;
    },

    async notifyNewOrder(orderNumber: number) {
      const { ownerChatIds } = await settings.getTelegramSettings();
      if (ownerChatIds.length === 0) return;
      const order = await orders.findByNumber(orderNumber);
      if (!order) return;
      const buttons = siteUrl
        ? [
            [
              {
                text: "Відкрити в адмінці",
                url: `${siteUrl}/admin/orders/${order.id}`,
              },
            ],
          ]
        : undefined;
      const results = await Promise.allSettled(
        ownerChatIds.map((chatId) =>
          bot.sendMessage(chatId, ownerNewOrderMessage(order), buttons),
        ),
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Owner Telegram alert failed", String(result.reason));
        }
      }
    },

    /** Tells a subscribed customer what changed. `previous` is before the update. */
    async notifyStatusChange(orderId: string, previous: Statuses) {
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
    },

    /** Reacts to a message sent to the bot (via the webhook). */
    async handleUpdate(update: TelegramUpdate) {
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

    /** A single-use link the owner opens to receive new-order alerts. */
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
