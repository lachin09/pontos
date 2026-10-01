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

/** A channel or group, and whether the bot is allowed to post there. */
export type TelegramChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title: string;
  /** The public @username without the @; null for private chats. */
  username: string | null;
  canPost: boolean;
};

/** Telegram shows at most this many photos in one album. */
export const MAX_ALBUM_PHOTOS = 10;

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
  /** Replaces the caption and buttons of a photo/file message the bot sent. */
  editCaption(
    chatId: number,
    messageId: number,
    html: string,
    buttons?: InlineButton[][],
  ): Promise<void>;
  /**
   * Copies a user's message (e.g. a receipt photo) into another chat with a
   * new caption, without the "forwarded from" header.
   */
  copyMessage(
    toChatId: number,
    fromChatId: number,
    messageId: number,
    captionHtml: string,
    buttons?: InlineButton[][],
  ): Promise<void>;
  /**
   * Posts photos by their public URLs with one caption: a single photo, or
   * an album of the first `MAX_ALBUM_PHOTOS`.
   */
  sendPhotos(
    chatId: number,
    photoUrls: string[],
    captionHtml: string,
  ): Promise<void>;
  /** Looks a chat up by "@username" or numeric id. */
  getChat(chat: string | number): Promise<TelegramChat>;
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
  let me: { id: number; username: string } | null = null;

  async function getMe() {
    me ??= await call<{ id: number; username: string }>("getMe");
    return me;
  }

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
    async editCaption(chatId, messageId, html, buttons) {
      try {
        await call("editMessageCaption", {
          chat_id: chatId,
          message_id: messageId,
          caption: html,
          parse_mode: "HTML",
          reply_markup: keyboard(buttons).reply_markup ?? {
            inline_keyboard: [],
          },
        });
      } catch (error) {
        if (
          error instanceof TelegramError &&
          error.message.includes("message is not modified")
        ) {
          return;
        }
        throw error;
      }
    },
    async copyMessage(toChatId, fromChatId, messageId, captionHtml, buttons) {
      await call("copyMessage", {
        chat_id: toChatId,
        from_chat_id: fromChatId,
        message_id: messageId,
        caption: captionHtml,
        parse_mode: "HTML",
        ...keyboard(buttons),
      });
    },
    async sendPhotos(chatId, photoUrls, captionHtml) {
      const [first, ...rest] = photoUrls.slice(0, MAX_ALBUM_PHOTOS);
      if (rest.length === 0) {
        await call("sendPhoto", {
          chat_id: chatId,
          photo: first,
          caption: captionHtml,
          parse_mode: "HTML",
        });
        return;
      }
      // An album shows the caption of its first photo under the whole group.
      await call("sendMediaGroup", {
        chat_id: chatId,
        media: [
          {
            type: "photo",
            media: first,
            caption: captionHtml,
            parse_mode: "HTML",
          },
          ...rest.map((url) => ({ type: "photo", media: url })),
        ],
      });
    },
    async getChat(chat) {
      const info = await call<{
        id: number;
        type: TelegramChat["type"];
        title?: string;
        username?: string;
      }>("getChat", { chat_id: chat });
      let canPost = false;
      try {
        const member = await call<{
          status: string;
          can_post_messages?: boolean;
        }>("getChatMember", {
          chat_id: info.id,
          user_id: (await getMe()).id,
        });
        canPost =
          info.type === "channel"
            ? member.status === "administrator" &&
              member.can_post_messages === true
            : member.status === "administrator" || member.status === "member";
      } catch (error) {
        // Telegram hides a channel's members from bots that are not its admins.
        if (!(error instanceof TelegramError)) throw error;
      }
      return {
        id: info.id,
        type: info.type,
        title: info.title ?? "",
        username: info.username ?? null,
        canPost,
      };
    },
    async answerCallback(callbackId, text) {
      await call("answerCallbackQuery", {
        callback_query_id: callbackId,
        ...(text ? { text } : {}),
      });
    },
    async getUsername() {
      return (await getMe()).username;
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
