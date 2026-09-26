import { describe, expect, it, vi } from "vitest";
import {
  createTelegramBot,
  isValidWebhookSecret,
  TelegramError,
  webhookSecretFor,
} from "@/lib/telegram/bot";

const ok = (result: unknown) =>
  new Response(JSON.stringify({ ok: true, result }), { status: 200 });

describe("webhook secret", () => {
  it("is stable per token and uses only characters Telegram allows", () => {
    expect(webhookSecretFor("123:abc")).toBe(webhookSecretFor("123:abc"));
    expect(webhookSecretFor("123:abc")).not.toBe(webhookSecretFor("123:abd"));
    expect(webhookSecretFor("123:abc")).toMatch(/^[A-Za-z0-9_-]{1,256}$/);
  });

  it("accepts only the exact secret", () => {
    const secret = webhookSecretFor("123:abc");
    expect(isValidWebhookSecret("123:abc", secret)).toBe(true);
    expect(isValidWebhookSecret("123:abc", secret.slice(1))).toBe(false);
    expect(isValidWebhookSecret("123:abc", webhookSecretFor("other"))).toBe(
      false,
    );
    expect(isValidWebhookSecret("123:abc", null)).toBe(false);
  });
});

describe("createTelegramBot", () => {
  it("sends HTML messages with link buttons to the Bot API", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await bot.sendMessage(42, "<b>Привіт</b>", [
      [{ text: "Сайт", url: "https://x.test" }],
    ]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.telegram.org/botTOKEN/sendMessage");
    expect(JSON.parse(init.body as string)).toEqual({
      chat_id: 42,
      text: "<b>Привіт</b>",
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [[{ text: "Сайт", url: "https://x.test" }]],
      },
    });
  });

  it("looks the username up once", async () => {
    const fetchMock = vi.fn(async () => ok({ username: "pontos_bot" }));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    expect(await bot.getUsername()).toBe("pontos_bot");
    expect(await bot.getUsername()).toBe("pontos_bot");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("registers the webhook for messages and button presses", async () => {
    const fetchMock = vi.fn(async () => ok(true));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await bot.setWebhook("https://shop.test/api/telegram/webhook", "s3cret");
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string)).toMatchObject({
      url: "https://shop.test/api/telegram/webhook",
      secret_token: "s3cret",
      allowed_updates: ["message", "callback_query"],
    });
  });

  it("maps callback buttons to Telegram's format", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await bot.sendMessage(1, "x", [[{ text: "OK", callbackData: "o:c:1" }]]);
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string).reply_markup).toEqual({
      inline_keyboard: [[{ text: "OK", callback_data: "o:c:1" }]],
    });
  });

  it("edits messages, clearing the keyboard when there are no buttons", async () => {
    const fetchMock = vi.fn(async () => ok({}));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await bot.editMessage(1, 9, "Оновлено");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/\/editMessageText$/);
    expect(JSON.parse(init.body as string)).toMatchObject({
      chat_id: 1,
      message_id: 9,
      reply_markup: { inline_keyboard: [] },
    });
  });

  it("ignores Telegram's 'message is not modified' on repeated edits", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error_code: 400,
            description: "Bad Request: message is not modified",
          }),
          { status: 400 },
        ),
    );
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await expect(bot.editMessage(1, 9, "same")).resolves.toBeUndefined();
  });

  it("answers button presses", async () => {
    const fetchMock = vi.fn(async () => ok(true));
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await bot.answerCallback("cb1", "Готово");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/\/answerCallbackQuery$/);
    expect(JSON.parse(init.body as string)).toEqual({
      callback_query_id: "cb1",
      text: "Готово",
    });
  });

  it("reports which updates the webhook receives", async () => {
    const fetchMock = vi.fn(async () =>
      ok({
        url: "https://x",
        pending_update_count: 0,
        allowed_updates: ["message"],
      }),
    );
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    await expect(bot.getWebhookInfo()).resolves.toMatchObject({
      allowedUpdates: ["message"],
    });
  });

  it("turns Telegram errors into TelegramError with the code", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error_code: 403,
            description: "Forbidden: bot was blocked by the user",
          }),
          { status: 403 },
        ),
    );
    const bot = createTelegramBot(
      "TOKEN",
      fetchMock as unknown as typeof fetch,
    );
    const error = await bot.sendMessage(1, "x").catch((caught) => caught);
    expect(error).toBeInstanceOf(TelegramError);
    expect(error).toMatchObject({
      code: 403,
      message: "Forbidden: bot was blocked by the user",
    });
  });
});
