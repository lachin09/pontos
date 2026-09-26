import { describe, expect, it, vi } from "vitest";
import type { InlineButton, TelegramBot } from "@/lib/telegram/bot";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";
import {
  EMPTY_TELEGRAM_SETTINGS,
  type TelegramSettings,
} from "@/lib/validators/telegram";
import type { OrderNotificationRepository } from "@/repositories/order.repository";
import { createOrderNotifier } from "@/services/order-notifier.service";
import type { NotifiableOrder } from "@/types/order";
import { makeNotifiableOrder } from "../../support/factories";

const TOKEN_HEX = "0b6d3c549f7e4c1a8e392f0c1d7a5b11";
const CODE = "a".repeat(32);

function setup({
  order = makeNotifiableOrder(),
  telegram = EMPTY_TELEGRAM_SETTINGS as TelegramSettings,
  bankDetails = "IBAN: UA12",
  phone = "+380971234567",
} = {}) {
  const orders = new Map<string, NotifiableOrder>([[order.id, { ...order }]]);
  const sent: { chatId: number; text: string; buttons?: InlineButton[][] }[] =
    [];
  let telegramSettings = { ...telegram };

  const repo: OrderNotificationRepository = {
    findById: async (id) => orders.get(id) ?? null,
    findByNumber: async (n) =>
      [...orders.values()].find((o) => o.orderNumber === n) ?? null,
    findByToken: async (t) =>
      [...orders.values()].find((o) => o.publicToken === t) ?? null,
    async setTelegramChat(id, chatId) {
      orders.get(id)!.telegramChatId = chatId;
    },
  };
  const bot: TelegramBot = {
    async sendMessage(chatId, text, buttons) {
      sent.push({ chatId, text, buttons });
    },
    getUsername: async () => "pontos_bot",
    setWebhook: vi.fn(),
    getWebhookInfo: vi.fn(),
  };
  const notifier = createOrderNotifier({
    orders: repo,
    bot,
    siteUrl: "https://shop.test",
    newCode: () => CODE,
    settings: {
      getStoreInfo: async () => ({
        ...EMPTY_STORE_INFO,
        seller: { ...EMPTY_STORE_INFO.seller, bankDetails, phone },
      }),
      getTelegramSettings: async () => telegramSettings,
      async saveTelegramSettings(value) {
        telegramSettings = value;
      },
    },
  });
  return {
    notifier,
    sent,
    order: () => orders.get(order.id)!,
    settings: () => telegramSettings,
    message: (text: string, chatId = 555) =>
      notifier.handleUpdate({ message: { chat: { id: chatId }, text } }),
  };
}

describe("order notifier", () => {
  describe("customer subscription", () => {
    it("builds a t.me link from the order's public token", async () => {
      const { notifier } = setup();
      await expect(notifier.orderLink(1042)).resolves.toBe(
        `https://t.me/pontos_bot?start=o_${TOKEN_HEX}`,
      );
      await expect(notifier.orderLink(9999)).resolves.toBeNull();
    });

    it("links the chat and sends the order summary", async () => {
      const { message, sent, order } = setup();
      await message(`/start o_${TOKEN_HEX}`);
      expect(order().telegramChatId).toBe(555);
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ chatId: 555 });
      expect(sent[0].text).toContain("Замовлення №1042");
    });

    it("lets the same chat open the link again", async () => {
      const { message, sent } = setup({
        order: makeNotifiableOrder({ telegramChatId: 555 }),
      });
      await message(`/start o_${TOKEN_HEX}`);
      expect(sent[0].text).toContain("Замовлення №1042");
    });

    it("refuses a second chat so a leaked link can't be hijacked", async () => {
      const { message, sent, order } = setup({
        order: makeNotifiableOrder({ telegramChatId: 111 }),
      });
      await message(`/start o_${TOKEN_HEX}`, 222);
      expect(order().telegramChatId).toBe(111);
      expect(sent[0].text).toContain("вже підключене до іншого чату");
    });

    it.each([`o_${"f".repeat(32)}`, "o_not-a-token", "o_"])(
      "rejects unknown token %s",
      async (payload) => {
        const { message, sent } = setup();
        await message(`/start ${payload}`);
        expect(sent[0].text).toContain("Не вдалося знайти це замовлення");
      },
    );
  });

  describe("owner connection", () => {
    it("creates a single-use link and connects the chat that opens it", async () => {
      const { notifier, message, sent, settings } = setup();
      await expect(notifier.createOwnerConnectLink()).resolves.toBe(
        `https://t.me/pontos_bot?start=a_${CODE}`,
      );
      await message(`/start a_${CODE}`, 777);
      expect(settings()).toEqual({ ownerChatIds: [777], connectCode: null });
      expect(sent[0].text).toContain("підключено");

      await message(`/start a_${CODE}`, 888);
      expect(settings().ownerChatIds).toEqual([777]);
      expect(sent[1].text).toContain("застаріло");
    });

    it("does not add the same chat twice", async () => {
      const { notifier, message, settings } = setup({
        telegram: { ownerChatIds: [777], connectCode: null },
      });
      await notifier.createOwnerConnectLink();
      await message(`/start a_${CODE}`, 777);
      expect(settings().ownerChatIds).toEqual([777]);
    });

    it("disconnects every owner chat", async () => {
      const { notifier, settings } = setup({
        telegram: { ownerChatIds: [1, 2], connectCode: CODE },
      });
      await notifier.disconnectOwners();
      expect(settings()).toEqual(EMPTY_TELEGRAM_SETTINGS);
    });
  });

  describe("new order alerts", () => {
    it("sends every owner chat the order with an admin link", async () => {
      const { notifier, sent } = setup({
        telegram: { ownerChatIds: [1, 2], connectCode: null },
      });
      await notifier.notifyNewOrder(1042);
      expect(sent.map((m) => m.chatId)).toEqual([1, 2]);
      expect(sent[0].text).toContain("Нове замовлення №1042");
      expect(sent[0].buttons).toEqual([
        [
          {
            text: "Відкрити в адмінці",
            url: "https://shop.test/admin/orders/3f2b1c9e-0000-4000-8000-000000000001",
          },
        ],
      ]);
    });

    it("keeps going when one chat fails", async () => {
      const setupResult = setup({
        telegram: { ownerChatIds: [1, 2], connectCode: null },
      });
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      const original = setupResult.sent.push.bind(setupResult.sent);
      let first = true;
      setupResult.sent.push = (...items) => {
        if (first) {
          first = false;
          throw new Error("blocked");
        }
        return original(...items);
      };
      await setupResult.notifier.notifyNewOrder(1042);
      expect(setupResult.sent.map((m) => m.chatId)).toEqual([2]);
      expect(log).toHaveBeenCalled();
    });

    it("does nothing without connected owners", async () => {
      const { notifier, sent } = setup();
      await notifier.notifyNewOrder(1042);
      expect(sent).toEqual([]);
    });
  });

  describe("status updates", () => {
    it("tells a subscribed customer about a confirmation, with bank details", async () => {
      const { notifier, sent } = setup({
        order: makeNotifiableOrder({
          telegramChatId: 555,
          status: "confirmed",
        }),
      });
      await notifier.notifyStatusChange(
        "3f2b1c9e-0000-4000-8000-000000000001",
        {
          status: "new",
          paymentStatus: "pending",
        },
      );
      expect(sent).toHaveLength(1);
      expect(sent[0].text).toContain("підтверджено");
      expect(sent[0].text).toContain("IBAN: UA12");
    });

    it("stays silent when nothing changed or nobody subscribed", async () => {
      const unchanged = setup({
        order: makeNotifiableOrder({ telegramChatId: 555 }),
      });
      await unchanged.notifier.notifyStatusChange(unchanged.order().id, {
        status: "new",
        paymentStatus: "pending",
      });
      expect(unchanged.sent).toEqual([]);

      const unsubscribed = setup({
        order: makeNotifiableOrder({ status: "shipped" }),
      });
      await unsubscribed.notifier.notifyStatusChange(unsubscribed.order().id, {
        status: "confirmed",
        paymentStatus: "pending",
      });
      expect(unsubscribed.sent).toEqual([]);
    });
  });

  describe("other messages", () => {
    it("greets a plain /start and answers anything else with the phone number", async () => {
      const { message, sent } = setup();
      await message("/start");
      await message("де моя посилка?");
      expect(sent[0].text).toContain("Вітаємо в PONTOS");
      expect(sent[1].text).toContain("+380971234567");
    });

    it("ignores updates without text", async () => {
      const { notifier, sent } = setup();
      await notifier.handleUpdate({});
      await notifier.handleUpdate({ message: { chat: { id: 1 } } });
      expect(sent).toEqual([]);
    });
  });
});
