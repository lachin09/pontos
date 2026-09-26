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

/** The part of a Telegram update the bot reacts to. Unknown fields are dropped. */
export const telegramUpdateSchema = z.object({
  message: z
    .object({
      chat: z.object({ id: z.number().int() }),
      text: z.string().optional(),
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
};
