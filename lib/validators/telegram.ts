import { z } from "zod";

export const TELEGRAM_SETTING_KEY = "telegram";

export const telegramSettingsSchema = z.object({
  /** Chats that receive new-order alerts (the owner, staff, a group). */
  ownerChatIds: z.array(z.number().int()).max(20),
  /** One-time code in the owner's "connect" link; null when none is open. */
  connectCode: z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .nullable(),
});

export type TelegramSettings = z.infer<typeof telegramSettingsSchema>;

export const EMPTY_TELEGRAM_SETTINGS: TelegramSettings = {
  ownerChatIds: [],
  connectCode: null,
};

export const TELEGRAM_CHANNEL_SETTING_KEY = "telegram_channel";

/** The channel (or group) where new products are posted; null when none. */
export const telegramChannelSchema = z
  .object({
    chatId: z.number().int(),
    title: z.string(),
    /** The public @username without the @; null for a private channel. */
    username: z.string().nullable(),
  })
  .nullable();

export type TelegramChannel = z.infer<typeof telegramChannelSchema>;

/**
 * What an admin may type to name their channel: "@pontos", "t.me/pontos" or
 * "https://t.me/pontos" become "@pontos"; a private channel is named by its
 * numeric id ("-1001234567890"). Invite links cannot be used: null.
 */
export function parseChatReference(input: string): string | number | null {
  const value = input.trim();
  if (/^-?\d{5,15}$/.test(value)) return Number(value);
  const name = value
    .replace(/^(https?:\/\/)?(t|telegram)\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return /^[a-z][a-z0-9_]{3,31}$/i.test(name) ? `@${name}` : null;
}

/** The part of a Telegram update the bot reacts to. Unknown fields are dropped. */
export const telegramUpdateSchema = z.object({
  message: z
    .object({
      message_id: z.number().int(),
      chat: z.object({ id: z.number().int() }),
      from: z.object({ language_code: z.string().optional() }).optional(),
      text: z.string().optional(),
      /** A photo (sizes) or a file: how customers send payment receipts. */
      photo: z.array(z.unknown()).optional(),
      document: z.object({}).optional(),
    })
    .optional(),
  /** A press on one of the bot's buttons. */
  callback_query: z
    .object({
      id: z.string(),
      data: z.string().max(64).optional(),
      message: z
        .object({
          message_id: z.number().int(),
          chat: z.object({ id: z.number().int() }),
          /** Present on a copied receipt: its text lives in the caption. */
          photo: z.array(z.unknown()).optional(),
          document: z.object({}).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;

/** Deep-link payloads: "o_<order token>" for customers, "a_<code>" for the owner. */
export const ORDER_START_PREFIX = "o_";
export const OWNER_START_PREFIX = "a_";

/** What the admin Telegram page shows. */
export type TelegramStatus = {
  configured: boolean;
  username: string | null;
  webhookUrl: string;
  webhookConnected: boolean;
  webhookError: string | null;
  ownerChats: number;
  channel: { title: string; username: string | null } | null;
};
