import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseCategoryRepository } from "@/repositories/supabase/category.repository";
import { createSupabaseOrderPlacementRepository } from "@/repositories/supabase/order.repository";
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
