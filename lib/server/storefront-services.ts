import { after } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseCategoryRepository } from "@/repositories/supabase/category.repository";
import { getTelegramBot } from "@/lib/telegram/bot";
import {
  createSupabaseOrderNotificationRepository,
  createSupabaseOrderPlacementRepository,
} from "@/repositories/supabase/order.repository";
import {
  createOrderNotifier,
  type OrderNotifier,
} from "@/services/order-notifier.service";
import { createSupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { createSupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { createCategoryService } from "@/services/category.service";
import { createProductService } from "@/services/product.service";
import { createSettingsService } from "@/services/settings.service";

/**
 * Composition root for the public storefront. Swap an implementation here
 * (e.g. the mocks in mocks/repositories.ts) and every page follows.
 */
export const productService = createProductService(
  createSupabaseProductRepository(),
);

export const categoryService = createCategoryService(
  createSupabaseCategoryRepository(),
);

/**
 * These need the service-role key, so they are created per call: a missing
 * key then fails the request that needs it, not the whole server.
 */
export const getOrderPlacement = () =>
  createSupabaseOrderPlacementRepository(createSupabaseAdminClient());

export const getStoreSettings = () =>
  createSettingsService(
    createSupabaseSettingsRepository(createSupabaseAdminClient()),
  );

/** The site's public address, used for links inside Telegram messages. */
export function siteUrl(): string | null {
  const host =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!host) return null;
  return host.startsWith("http") ? host.replace(/\/+$/, "") : `https://${host}`;
}

/** Telegram order notifications, or null when TELEGRAM_BOT_TOKEN is not set. */
export function getOrderNotifier(): OrderNotifier | null {
  const telegram = getTelegramBot();
  if (!telegram) return null;
  const client = createSupabaseAdminClient();
  return createOrderNotifier({
    orders: createSupabaseOrderNotificationRepository(client),
    settings: createSettingsService(createSupabaseSettingsRepository(client)),
    bot: telegram.bot,
    siteUrl: siteUrl(),
  });
}

/**
 * Runs notification work after the response is sent. Failures are logged,
 * never shown to the customer: a missed message must not break an order.
 */
export function notifyInBackground(
  label: string,
  task: (notifier: OrderNotifier) => Promise<unknown>,
) {
  after(async () => {
    try {
      const notifier = getOrderNotifier();
      if (notifier) await task(notifier);
    } catch (error) {
      console.error(
        `Telegram: ${label} failed`,
        error instanceof Error ? error.message : error,
      );
    }
  });
}
