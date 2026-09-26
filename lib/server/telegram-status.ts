import { siteUrl } from "@/lib/server/storefront-services";
import { getTelegramBot } from "@/lib/telegram/bot";
import type { TelegramStatus } from "@/lib/validators/telegram";
import type { SettingsService } from "@/services/settings.service";

/** Where Telegram should send updates: the site's own webhook route. */
export function telegramWebhookUrl(fallbackOrigin: string) {
  return `${siteUrl() ?? fallbackOrigin}/api/telegram/webhook`;
}

/** Everything the admin Telegram page needs to show the setup steps. */
export async function getTelegramStatus(
  settings: Pick<SettingsService, "getTelegramSettings">,
  fallbackOrigin: string,
): Promise<TelegramStatus> {
  const telegram = getTelegramBot();
  const webhookUrl = telegramWebhookUrl(fallbackOrigin);
  const { ownerChatIds } = await settings.getTelegramSettings();
  const status: TelegramStatus = {
    configured: Boolean(telegram),
    username: null,
    webhookUrl,
    webhookConnected: false,
    webhookError: null,
    ownerChats: ownerChatIds.length,
  };
  if (!telegram) return status;
  try {
    const [username, info] = await Promise.all([
      telegram.bot.getUsername(),
      telegram.bot.getWebhookInfo(),
    ]);
    status.username = username;
    status.webhookConnected = info.url === webhookUrl;
    status.webhookError = info.lastErrorMessage;
  } catch (error) {
    status.webhookError =
      error instanceof Error ? error.message : "Telegram недоступний";
  }
  return status;
}
