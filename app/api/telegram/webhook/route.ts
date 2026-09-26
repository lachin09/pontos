import { NextResponse } from "next/server";
import { isValidWebhookSecret, getTelegramBot } from "@/lib/telegram/bot";
import { notifyInBackground } from "@/lib/server/storefront-services";
import { telegramUpdateSchema } from "@/lib/validators/telegram";

/**
 * Telegram posts every message sent to the bot here. The secret header proves
 * the request came from Telegram. We always answer 200 quickly and do the
 * work afterwards; a non-200 would make Telegram retry the same update.
 */
export async function POST(request: Request) {
  const telegram = getTelegramBot();
  if (!telegram) return new NextResponse(null, { status: 404 });
  if (
    !isValidWebhookSecret(
      telegram.token,
      request.headers.get("x-telegram-bot-api-secret-token"),
    )
  ) {
    return new NextResponse(null, { status: 401 });
  }

  const update = telegramUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (update.success) {
    notifyInBackground("bot message", (notifier) =>
      notifier.handleUpdate(update.data),
    );
  }
  return NextResponse.json({ ok: true });
}
