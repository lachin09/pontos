import { describe, expect, it, vi } from "vitest";
import type { InlineButton, TelegramBot } from "@/lib/telegram/bot";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";
import type { ContactLinkRecord } from "@/lib/validators/contact-links";
import {
  EMPTY_TELEGRAM_SETTINGS,
  type TelegramChannel,
  type TelegramSettings,
} from "@/lib/validators/telegram";
import type { OrderNotificationRepository } from "@/repositories/order.repository";
import { createOrderNotifier } from "@/services/order-notifier.service";
import type { NotifiableOrder } from "@/types/order";
import { makeNotifiableOrder } from "../../support/factories";

const TOKEN_HEX = "0b6d3c549f7e4c1a8e392f0c1d7a5b11";
const ID_HEX = "3f2b1c9e000040008000000000000001";
const CODE = "a".repeat(32);

type Sent = { chatId: number; text: string; buttons?: InlineButton[][] };

function setup({
  order = makeNotifiableOrder(),
  telegram = EMPTY_TELEGRAM_SETTINGS as TelegramSettings,
  bankDetails = "IBAN: UA12",
  phone = "+380971234567",
  failStatusUpdate = false,
  failSendTo = [] as number[],
  channel = null as TelegramChannel,
  contactLinks = [] as ContactLinkRecord[],
} = {}) {
  const orders = new Map<string, NotifiableOrder>([[order.id, { ...order }]]);
  const sent: Sent[] = [];
  const edits: (Sent & { messageId: number })[] = [];
  const answers: { id: string; text?: string }[] = [];
  const statusCalls: { orderId: string; statuses: unknown; chatId: number }[] =
    [];
  const copies: (Sent & { fromChatId: number; messageId: number })[] = [];
  const captions: (Sent & { messageId: number })[] = [];
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
    async findAwaitingPaymentByChat(chatId) {
      return (
        [...orders.values()]
          .filter(
            (o) =>
              o.telegramChatId === chatId &&
              o.paymentMethod === "bank_transfer" &&
              o.paymentStatus !== "paid" &&
              o.status !== "cancelled",
          )
          .sort((a, b) => b.orderNumber - a.orderNumber)[0] ?? null
      );
    },
    async markReceiptSent(id) {
      const current = orders.get(id);
      if (current?.paymentStatus === "pending") {
        current.paymentStatus = "awaiting_confirmation";
      }
    },
    async updateStatusFromTelegram(orderId, statuses, chatId) {
      if (failStatusUpdate) throw new Error("permission denied");
      statusCalls.push({ orderId, statuses, chatId });
      const current = orders.get(orderId);
      if (!current) return false;
      Object.assign(current, statuses);
      return true;
    },
  };
  const bot: TelegramBot = {
    async sendMessage(chatId, text, buttons) {
      if (failSendTo.includes(chatId)) throw new Error("bot was blocked");
      sent.push({ chatId, text, buttons });
    },
    async editMessage(chatId, messageId, text, buttons) {
      edits.push({ chatId, messageId, text, buttons });
    },
    async editCaption(chatId, messageId, text, buttons) {
      captions.push({ chatId, messageId, text, buttons });
    },
    async copyMessage(chatId, fromChatId, messageId, text, buttons) {
      if (failSendTo.includes(chatId)) throw new Error("bot was blocked");
      copies.push({ chatId, fromChatId, messageId, text, buttons });
    },
    async answerCallback(id, text) {
      answers.push({ id, text });
    },
    sendPhotos: vi.fn(),
    getChat: vi.fn(),
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
      getTelegramChannel: async () => channel,
      getContactLinks: async () => contactLinks,
    },
  });
  return {
    notifier,
    sent,
    edits,
    copies,
    captions,
    answers,
    statusCalls,
    order: () => orders.get(order.id)!,
    settings: () => telegramSettings,
    message: (text: string, chatId = 555, languageCode?: string) =>
      notifier.handleUpdate({
        message: {
          message_id: 1,
          chat: { id: chatId },
          from: languageCode ? { language_code: languageCode } : undefined,
          text,
        },
      }),
    photo: (chatId = 555, messageId = 42) =>
      notifier.handleUpdate({
        message: { message_id: messageId, chat: { id: chatId }, photo: [{}] },
      }),
    press: (data: string, chatId = 777, onReceipt = false) =>
      notifier.handleUpdate({
        callback_query: {
          id: "cb1",
          data,
          message: {
            message_id: 9,
            chat: { id: chatId },
            ...(onReceipt ? { photo: [{}] } : {}),
          },
        },
      }),
  };
}

const buttonTexts = (buttons?: InlineButton[][]) =>
  (buttons ?? []).map((row) => row.map((button) => button.text));

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

    it("tells the owners once the customer is reachable in Telegram", async () => {
      const { message, sent } = setup({
        telegram: { ownerChatIds: [777], connectCode: null },
      });
      await message(`/start o_${TOKEN_HEX}`);
      await message(`/start o_${TOKEN_HEX}`);
      const owner = sent.filter((m) => m.chatId === 777);
      expect(owner).toHaveLength(1);
      expect(owner[0].text).toContain("Замовлення №1042");
      expect(owner[0].text).toContain("підключив(ла) Telegram");
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

  describe("new order cards", () => {
    it("sends every owner chat the order with status buttons and an admin link", async () => {
      const { notifier, sent } = setup({
        telegram: { ownerChatIds: [1, 2], connectCode: null },
      });
      await notifier.notifyNewOrder(1042);
      expect(sent.map((m) => m.chatId)).toEqual([1, 2]);
      expect(sent[0].text).toContain("Нове замовлення №1042");
      expect(sent[0].text).toContain("Статус:</b> Нове");
      expect(sent[0].buttons).toEqual([
        [
          { text: "✅ Підтвердити", callbackData: `o:c:${ID_HEX}` },
          { text: "❌ Скасувати", callbackData: `o:x:${ID_HEX}` },
        ],
        [
          {
            text: "Відкрити в адмінці",
            url: "https://shop.test/admin/orders/3f2b1c9e-0000-4000-8000-000000000001",
          },
        ],
      ]);
    });

    it("keeps going when one chat fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { notifier, sent } = setup({
        telegram: { ownerChatIds: [1, 2], connectCode: null },
        failSendTo: [1],
      });
      await notifier.notifyNewOrder(1042);
      expect(sent.map((m) => m.chatId)).toEqual([2]);
    });

    it("does nothing without connected owners", async () => {
      const { notifier, sent } = setup();
      await notifier.notifyNewOrder(1042);
      expect(sent).toEqual([]);
    });
  });

  describe("owner status buttons", () => {
    const owner = { telegram: { ownerChatIds: [777], connectCode: null } };

    it("confirms an order, redraws the card, and tells the customer", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({ telegramChatId: 555 }),
      });
      await t.press(`o:c:${ID_HEX}`);

      expect(t.statusCalls).toEqual([
        {
          orderId: t.order().id,
          statuses: { status: "confirmed", paymentStatus: "pending" },
          chatId: 777,
        },
      ]);
      expect(t.edits[0]).toMatchObject({ chatId: 777, messageId: 9 });
      expect(t.edits[0].text).toContain("Статус:</b> Підтверджене");
      expect(t.edits[0].text).toContain("Змінено в Telegram");
      // Transfer order, not paid yet → the next step is "payment received".
      expect(buttonTexts(t.edits[0].buttons)[0]).toEqual([
        "💰 Оплату отримано",
        "❌ Скасувати",
      ]);
      expect(t.answers).toEqual([{ id: "cb1", text: "Готово: Підтверджене" }]);
      expect(t.sent).toHaveLength(1);
      expect(t.sent[0]).toMatchObject({ chatId: 555 });
      expect(t.sent[0].text).toContain("IBAN: UA12");
    });

    it("marks a transfer as paid", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({ status: "confirmed" }),
      });
      await t.press(`o:p:${ID_HEX}`);
      expect(t.order()).toMatchObject({
        status: "paid",
        paymentStatus: "paid",
      });
      expect(buttonTexts(t.edits[0].buttons)[0]).toEqual([
        "📦 Відправлено",
        "❌ Скасувати",
      ]);
    });

    it("asks before cancelling, and can go back", async () => {
      const t = setup(owner);
      await t.press(`o:x:${ID_HEX}`);
      expect(t.statusCalls).toEqual([]);
      expect(t.edits[0].text).toContain("Скасувати це замовлення?");
      expect(t.edits[0].buttons).toEqual([
        [
          { text: "Немає в наявності", callbackData: `o:O:${ID_HEX}` },
          { text: "Інша причина", callbackData: `o:X:${ID_HEX}` },
        ],
        [{ text: "↩︎ Назад", callbackData: `o:b:${ID_HEX}` }],
      ]);

      await t.press(`o:b:${ID_HEX}`);
      expect(buttonTexts(t.edits[1].buttons)[0]).toEqual([
        "✅ Підтвердити",
        "❌ Скасувати",
      ]);

      await t.press(`o:X:${ID_HEX}`);
      expect(t.order().status).toBe("cancelled");
      expect(buttonTexts(t.edits[2].buttons)).toEqual([["Відкрити в адмінці"]]);
    });

    it("tells the customer the item is out of stock when that is the reason", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({ telegramChatId: 555 }),
      });
      await t.press(`o:O:${ID_HEX}`);
      expect(t.order().status).toBe("cancelled");
      expect(t.edits[0].text).toContain(
        "Скасовано в Telegram: немає в наявності",
      );
      expect(t.sent).toHaveLength(1);
      expect(t.sent[0].text).toContain("вже немає в наявності");
      expect(t.sent[0].text).not.toContain("Якщо це помилка");
    });

    it("cancels for another reason with the usual message", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({ telegramChatId: 555 }),
      });
      await t.press(`o:X:${ID_HEX}`);
      expect(t.sent[0].text).toContain("Замовлення скасовано. Якщо це помилка");
    });

    it("does not offer 'out of stock' for an order that is already paid", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({
          status: "paid",
          paymentStatus: "paid",
          telegramChatId: 555,
        }),
      });
      await t.press(`o:x:${ID_HEX}`);
      expect(buttonTexts(t.edits[0].buttons)).toEqual([
        ["Так, скасувати", "↩︎ Назад"],
      ]);

      // A stale "out of stock" button still cancels, with the usual message.
      await t.press(`o:O:${ID_HEX}`);
      expect(t.order().status).toBe("cancelled");
      expect(t.sent[0].text).toContain("Якщо це помилка");
    });

    it("refuses presses from chats that are not owner chats", async () => {
      const t = setup(owner);
      await t.press(`o:c:${ID_HEX}`, 12345);
      expect(t.statusCalls).toEqual([]);
      expect(t.edits).toEqual([]);
      expect(t.answers).toEqual([{ id: "cb1", text: "Немає доступу" }]);
    });

    it("handles stale buttons by redrawing the current state", async () => {
      const t = setup({
        ...owner,
        order: makeNotifiableOrder({ status: "shipped" }),
      });
      await t.press(`o:c:${ID_HEX}`);
      expect(t.statusCalls).toEqual([]);
      expect(t.answers[0].text).toBe("Статус уже змінено: Відправлене");
      expect(buttonTexts(t.edits[0].buttons)[0]).toEqual(["🏁 Доставлено"]);
    });

    it("answers unknown orders and malformed data without changing anything", async () => {
      const t = setup(owner);
      await t.press(`o:c:${"f".repeat(32)}`);
      await t.press("hello");
      expect(t.statusCalls).toEqual([]);
      expect(t.answers.map((a) => a.text)).toEqual([
        "Замовлення не знайдено",
        "Замовлення не знайдено",
      ]);
    });

    it("reports a failed update instead of crashing the webhook", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const t = setup({ ...owner, failStatusUpdate: true });
      await t.press(`o:c:${ID_HEX}`);
      expect(t.answers).toEqual([
        { id: "cb1", text: "Не вдалося змінити статус. Спробуйте в адмінці." },
      ]);
      expect(t.order().status).toBe("new");
    });
  });

  describe("customer status updates", () => {
    it("tells a subscribed customer about a confirmation, with bank details", async () => {
      const { notifier, sent } = setup({
        order: makeNotifiableOrder({
          telegramChatId: 555,
          status: "confirmed",
        }),
      });
      await notifier.notifyStatusChange(
        "3f2b1c9e-0000-4000-8000-000000000001",
        { status: "new", paymentStatus: "pending" },
      );
      expect(sent).toHaveLength(1);
      expect(sent[0].text).toContain("підтверджено");
      expect(sent[0].text).toContain("IBAN: UA12");
    });

    describe("follow-us buttons after a completed purchase", () => {
      const follow = {
        channel: { chatId: -1001, title: "PONTOS", username: "pontos_shop" },
        contactLinks: [
          {
            id: "5f0e9b9e-0000-4000-8000-000000000001",
            type: "phone" as const,
            label: "Телефон",
            value: "+380971234567",
          },
          {
            id: "5f0e9b9e-0000-4000-8000-000000000002",
            type: "instagram" as const,
            label: "Instagram",
            value: "@pontos",
          },
          {
            id: "5f0e9b9e-0000-4000-8000-000000000003",
            type: "tiktok" as const,
            label: "TikTok",
            value: "pontos",
          },
        ],
      };
      const ID = "3f2b1c9e-0000-4000-8000-000000000001";

      it("invites a customer whose transfer was just confirmed as paid", async () => {
        const { notifier, sent } = setup({
          ...follow,
          order: makeNotifiableOrder({
            telegramChatId: 555,
            status: "paid",
            paymentStatus: "paid",
          }),
        });
        await notifier.notifyStatusChange(ID, {
          status: "confirmed",
          paymentStatus: "pending",
        });
        expect(sent[0].text).toContain("оплату отримано");
        expect(sent[0].text).toContain("Підписуйтесь на нас");
        expect(sent[0].buttons).toEqual([
          [
            { text: "Telegram-канал", url: "https://t.me/pontos_shop" },
            { text: "Instagram", url: "https://www.instagram.com/pontos" },
          ],
          [{ text: "TikTok", url: "https://www.tiktok.com/@pontos" }],
        ]);
      });

      it("invites a cash-on-delivery customer once the order is delivered", async () => {
        const { notifier, sent } = setup({
          ...follow,
          order: makeNotifiableOrder({
            telegramChatId: 555,
            paymentMethod: "cash_on_delivery",
            paymentStatus: "cash_on_delivery",
            status: "delivered",
          }),
        });
        await notifier.notifyStatusChange(ID, {
          status: "shipped",
          paymentStatus: "cash_on_delivery",
        });
        expect(sent[0].text).toContain("доставлено");
        expect(buttonTexts(sent[0].buttons)).toEqual([
          ["Telegram-канал", "Instagram"],
          ["TikTok"],
        ]);
      });

      it("does not repeat the invitation on other updates", async () => {
        // A prepaid order being delivered was already invited when it was paid.
        const { notifier, sent } = setup({
          ...follow,
          order: makeNotifiableOrder({
            telegramChatId: 555,
            status: "delivered",
            paymentStatus: "paid",
          }),
        });
        await notifier.notifyStatusChange(ID, {
          status: "shipped",
          paymentStatus: "paid",
        });
        expect(sent[0].text).not.toContain("Підписуйтесь");
        expect(sent[0].buttons).toBeUndefined();
      });

      it("sends the plain update when the store has nothing to follow", async () => {
        const { notifier, sent } = setup({
          order: makeNotifiableOrder({
            telegramChatId: 555,
            status: "paid",
            paymentStatus: "paid",
          }),
        });
        await notifier.notifyStatusChange(ID, {
          status: "confirmed",
          paymentStatus: "pending",
        });
        expect(sent[0].text).not.toContain("Підписуйтесь");
        expect(sent[0].buttons).toBeUndefined();
      });
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

    it("follows the customer's Telegram language when there is no order", async () => {
      const { message, sent } = setup();
      await message("/start", 555, "en-GB");
      await message("hello?", 555, "ru");
      await message(`/start o_${"f".repeat(32)}`, 555, "en");
      expect(sent[0].text).toContain("Welcome to PONTOS");
      expect(sent[1].text).toContain("Позвоните нам: +380971234567");
      expect(sent[2].text).toContain("could not find this order");
    });

    it("ignores updates without text", async () => {
      const { notifier, sent } = setup();
      await notifier.handleUpdate({});
      await notifier.handleUpdate({
        message: { message_id: 1, chat: { id: 1 } },
      });
      expect(sent).toEqual([]);
    });
  });

  describe("payment receipts", () => {
    const linked = () =>
      makeNotifiableOrder({
        status: "confirmed",
        telegramChatId: 555,
        locale: "en",
      });

    it("copies a customer's photo to the owners and confirms receipt", async () => {
      const { photo, sent, copies, order } = setup({
        order: linked(),
        telegram: { ownerChatIds: [777, 778], connectCode: null },
      });
      await photo(555, 42);
      expect(order().paymentStatus).toBe("awaiting_confirmation");
      expect(copies.map((c) => c.chatId)).toEqual([777, 778]);
      expect(copies[0]).toMatchObject({ fromChatId: 555, messageId: 42 });
      expect(copies[0].text).toContain("Квитанція до замовлення №1042");
      expect(copies[0].text).toContain("Очікує підтвердження");
      expect(buttonTexts(copies[0].buttons)).toEqual([
        ["💰 Оплату отримано", "❌ Скасувати"],
        ["Відкрити в адмінці"],
      ]);
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ chatId: 555 });
      expect(sent[0].text).toContain("We have received your receipt");
    });

    it("still thanks the customer when an owner chat is unreachable", async () => {
      const { photo, sent, copies } = setup({
        order: linked(),
        telegram: { ownerChatIds: [777, 778], connectCode: null },
        failSendTo: [777],
      });
      await photo();
      expect(copies.map((c) => c.chatId)).toEqual([778]);
      expect(sent[0].text).toContain("received your receipt");
    });

    it("explains when nothing awaits payment in this chat", async () => {
      const { photo, sent, copies } = setup({
        order: makeNotifiableOrder({
          paymentMethod: "cash_on_delivery",
          telegramChatId: 555,
        }),
        telegram: { ownerChatIds: [777], connectCode: null },
      });
      await photo(555);
      await photo(999);
      expect(copies).toEqual([]);
      expect(sent).toHaveLength(2);
      expect(sent[0].text).toContain(
        "Не знайшли замовлення, яке очікує оплати",
      );
      expect(sent[0].text).toContain("+380971234567");
    });

    it("lets the owner mark the receipt as paid under the photo", async () => {
      const { photo, press, captions, edits, sent, order, answers } = setup({
        order: linked(),
        telegram: { ownerChatIds: [777], connectCode: null },
      });
      await photo();
      await press(`o:p:${ID_HEX}`, 777, true);
      expect(order()).toMatchObject({ status: "paid", paymentStatus: "paid" });
      expect(edits).toEqual([]);
      expect(captions).toHaveLength(1);
      expect(captions[0].text).toContain("Оплачене · Оплачене");
      expect(captions[0].text).toContain("Змінено в Telegram");
      expect(answers.at(-1)?.text).toContain("Готово");
      // The customer hears it in their language.
      expect(sent.at(-1)?.text).toContain("Thank you, payment received!");
    });
  });
});
