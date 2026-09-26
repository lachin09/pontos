import { z } from "zod";
import { AppError, badRequest } from "@/lib/errors";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { getOrderNotifier } from "@/lib/server/storefront-services";
import {
  getTelegramStatus,
  telegramWebhookUrl,
} from "@/lib/server/telegram-status";
import { getTelegramBot, webhookSecretFor } from "@/lib/telegram/bot";

const origin = (request: Request) => new URL(request.url).origin;

export const GET = adminRoute(async (request, { services }) =>
  json(await getTelegramStatus(services.settings, origin(request))),
);

const actionSchema = z.object({
  action: z.enum(["connect-webhook", "owner-link", "disconnect-owners"]),
});

export const POST = adminRoute(async (request) => {
  const { action } = await readJson(request, actionSchema, {
    message: "Некоректний запит.",
  });
  const telegram = getTelegramBot();
  const notifier = getOrderNotifier();
  if (!telegram || !notifier) {
    throw new AppError(
      "Бот не налаштований: додайте TELEGRAM_BOT_TOKEN у змінні середовища Vercel.",
      503,
    );
  }

  try {
    if (action === "connect-webhook") {
      await telegram.bot.setWebhook(
        telegramWebhookUrl(origin(request)),
        webhookSecretFor(telegram.token),
      );
      return json({ ok: true });
    }
    if (action === "owner-link") {
      return json({ url: await notifier.createOwnerConnectLink() });
    }
    await notifier.disconnectOwners();
    return json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw badRequest(
      `Telegram відповів помилкою: ${error instanceof Error ? error.message : "невідома помилка"}`,
    );
  }
});
