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

  it("registers the webhook with its secret, for messages only", async () => {
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
      allowed_updates: ["message"],
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
