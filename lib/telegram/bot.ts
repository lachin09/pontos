import { createHash, timingSafeEqual } from "node:crypto";

/** A link button, or a button that sends `callbackData` back to the bot. */
export type InlineButton =
  { text: string; url: string } | { text: string; callbackData: string };

export type WebhookInfo = {
  url: string;
  allowedUpdates: string[];
  pendingUpdateCount: number;
  lastErrorMessage: string | null;
};

/** What the app needs from Telegram. Services depend on this, not on HTTP. */
export interface TelegramBot {
  /** Sends HTML-formatted text; `buttons` are rows of link buttons. */
  sendMessage(
    chatId: number,
    html: string,
    buttons?: InlineButton[][],
  ): Promise<void>;
  /** Replaces the text and buttons of a message the bot sent earlier. */
  editMessage(
    chatId: number,
    messageId: number,
    html: string,
    buttons?: InlineButton[][],
  ): Promise<void>;
  /** Shows a short notice to whoever pressed a button (required by Telegram). */
  answerCallback(callbackId: string, text?: string): Promise<void>;
  /** The bot's @username without the @, used to build t.me links. */
  getUsername(): Promise<string>;
  setWebhook(url: string, secret: string): Promise<void>;
  getWebhookInfo(): Promise<WebhookInfo>;
}

export class TelegramError extends Error {
  constructor(
    message: string,
    /** Telegram's error code, e.g. 403 when the user blocked the bot. */
    readonly code: number,
  ) {
    super(message);
    this.name = "TelegramError";
  }
}

/**
 * The webhook secret is derived from the bot token, so there is one fewer
 * setting to manage. Telegram allows A–Z, a–z, 0–9, _ and - (1–256 chars).
 */
export function webhookSecretFor(token: string) {
  return createHash("sha256")
    .update(`pontos-telegram-webhook:${token}`)
    .digest("hex");
}

export function isValidWebhookSecret(token: string, received: string | null) {
  if (!received) return false;
  const expected = Buffer.from(webhookSecretFor(token));
  const actual = Buffer.from(received);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Updates the bot asks Telegram to deliver to the webhook. */
export const WEBHOOK_UPDATES = ["message", "callback_query"];

function keyboard(buttons?: InlineButton[][]) {
  if (!buttons?.length) return {};
  return {
    reply_markup: {
      inline_keyboard: buttons.map((row) =>
        row.map((button) =>
          "url" in button
            ? { text: button.text, url: button.url }
            : { text: button.text, callback_data: button.callbackData },
        ),
      ),
    },
  };
}

export function createTelegramBot(
  token: string,
  fetchImpl: typeof fetch = fetch,
): TelegramBot {
  let username: string | null = null;

  async function call<T>(method: string, body?: unknown): Promise<T> {
    const response = await fetchImpl(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
        cache: "no-store",
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      description?: string;
      error_code?: number;
    } | null;
    if (!payload?.ok) {
      throw new TelegramError(
        payload?.description ?? `Telegram ${method} failed`,
        payload?.error_code ?? response.status,
      );
    }
    return payload.result as T;
  }

  return {
    async sendMessage(chatId, html, buttons) {
      await call("sendMessage", {
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...keyboard(buttons),
      });
    },
    async editMessage(chatId, messageId, html, buttons) {
      try {
        await call("editMessageText", {
          chat_id: chatId,
          message_id: messageId,
          text: html,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          // An empty keyboard removes the buttons.
          reply_markup: keyboard(buttons).reply_markup ?? {
            inline_keyboard: [],
          },
        });
      } catch (error) {
        // Pressing a button twice re-renders the same message; that's fine.
        if (
          error instanceof TelegramError &&
          error.message.includes("message is not modified")
        ) {
          return;
        }
        throw error;
      }
    },
    async answerCallback(callbackId, text) {
      await call("answerCallbackQuery", {
        callback_query_id: callbackId,
        ...(text ? { text } : {}),
      });
    },
    async getUsername() {
      username ??= (await call<{ username: string }>("getMe")).username;
      return username;
    },
    async setWebhook(url, secret) {
      await call("setWebhook", {
        url,
        secret_token: secret,
        allowed_updates: WEBHOOK_UPDATES,
        drop_pending_updates: true,
      });
    },
    async getWebhookInfo() {
      const info = await call<{
        url: string;
        allowed_updates?: string[];
        pending_update_count: number;
        last_error_message?: string;
      }>("getWebhookInfo");
      return {
        url: info.url,
        // Telegram omits the list when every update type is allowed.
        allowedUpdates: info.allowed_updates ?? WEBHOOK_UPDATES,
        pendingUpdateCount: info.pending_update_count,
        lastErrorMessage: info.last_error_message ?? null,
      };
    },
  };
}

let cached: { token: string; bot: TelegramBot } | null = null;

/** The configured bot, or null when TELEGRAM_BOT_TOKEN is not set. */
export function getTelegramBot(): { token: string; bot: TelegramBot } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  if (cached?.token !== token)
    cached = { token, bot: createTelegramBot(token) };
  return cached;
}
