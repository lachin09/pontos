import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { createSupabaseImageStorage } from "@/lib/storage/image-storage";
import { createSupabaseCategoryAdminRepository } from "@/repositories/supabase/category.repository";
import { createSupabaseNotificationRepository } from "@/repositories/supabase/notification.repository";
import { createSupabaseOrderAdminRepository } from "@/repositories/supabase/order.repository";
import {
  createSupabaseChannelPostRepository,
  createSupabaseProductAdminRepository,
  createSupabaseProductImageRepository,
} from "@/repositories/supabase/product-admin.repository";
import { createSupabaseSettingsRepository } from "@/repositories/supabase/settings.repository";
import { siteUrl } from "@/lib/server/storefront-services";
import { getTelegramBot } from "@/lib/telegram/bot";
import { createCategoryAdminService } from "@/services/admin/category-admin.service";
import { createProductAdminService } from "@/services/admin/product-admin.service";
import { createChannelPoster } from "@/services/channel-poster.service";
import { createSettingsService } from "@/services/settings.service";

/**
 * Composition root for the admin area: the only place that decides which
 * implementations back the admin services. Everything is built on the
 * signed-in admin's client, so row-level security still applies.
 */
export function createAdminServices(client: SupabaseClient<Database>) {
  const storage = createSupabaseImageStorage(client);
  const products = createSupabaseProductAdminRepository(client, storage);
  const settings = createSettingsService(
    createSupabaseSettingsRepository(client),
  );
  return {
    products: createProductAdminService({
      products,
      images: createSupabaseProductImageRepository(client),
      storage,
    }),
    categories: createCategoryAdminService({
      categories: createSupabaseCategoryAdminRepository(client),
      storage,
    }),
    orders: createSupabaseOrderAdminRepository(client),
    notifications: createSupabaseNotificationRepository(client),
    settings,
    channel: createChannelPoster({
      products,
      posts: createSupabaseChannelPostRepository(client),
      settings,
      bot: getTelegramBot()?.bot ?? null,
      siteUrl: siteUrl(),
    }),
  };
}

export type AdminServices = ReturnType<typeof createAdminServices>;

/** For admin pages: redirects to the login page unless an active admin is signed in. */
export async function requireAdminServices(): Promise<AdminServices> {
  const session = await getActiveAdminSession();
  if (!session) redirect("/admin/login?reason=unauthorized");
  return createAdminServices(session.supabase);
}
