import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import {
  CONTACT_LINKS_SETTING_KEY,
  contactLinksSchema,
  type ContactLinkRecord,
} from "@/lib/validators/contact-links";
import { createSupabaseCategoryRepository } from "@/repositories/supabase/category.repository";
import { createSupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { createCategoryService } from "@/services/category.service";
import { createProductService } from "@/services/product.service";

// Storefront reads are cached across requests and invalidated by tag from the
// admin routes (see lib/data/revalidate.ts). The time-based fallback covers
// changes made directly in the Supabase dashboard.
const FALLBACK_REVALIDATE_SECONDS = 300;

const productService = createProductService(createSupabaseProductRepository());
const categoryService = createCategoryService(
  createSupabaseCategoryRepository(),
);

export const getPublishedProducts = unstable_cache(
  () => productService.listProducts(),
  ["storefront:products:list"],
  { tags: [CACHE_TAGS.products], revalidate: FALLBACK_REVALIDATE_SECONDS },
);

// React cache() dedupes the call shared by generateMetadata and the page.
export const getPublishedProductBySlug = cache(
  unstable_cache(
    (slug: string) => productService.getProductBySlug(slug),
    ["storefront:products:by-slug"],
    { tags: [CACHE_TAGS.products], revalidate: FALLBACK_REVALIDATE_SECONDS },
  ),
);

export const getRelatedProducts = unstable_cache(
  (categoryId: string, excludeId: string) =>
    productService.listRelatedProducts(categoryId, excludeId, 4),
  ["storefront:products:related"],
  { tags: [CACHE_TAGS.products], revalidate: FALLBACK_REVALIDATE_SECONDS },
);

export const getActiveCategories = unstable_cache(
  () => categoryService.listActiveCategories(),
  ["storefront:categories:active"],
  { tags: [CACHE_TAGS.categories], revalidate: FALLBACK_REVALIDATE_SECONDS },
);

export const getContactLinks = unstable_cache(
  async (): Promise<ContactLinkRecord[]> => {
    // store_settings has no public RLS policy, so this single public key is
    // read server-side with the service role and never exposed to the client.
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", CONTACT_LINKS_SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.error("Failed to load contact links from Supabase:", error.message);
      throw new Error("Не вдалося завантажити контакти.");
    }

    const parsed = contactLinksSchema.safeParse(data?.value ?? { links: [] });
    return parsed.success ? parsed.data.links : [];
  },
  ["storefront:contact-links"],
  { tags: [CACHE_TAGS.contactLinks], revalidate: FALLBACK_REVALIDATE_SECONDS },
);
