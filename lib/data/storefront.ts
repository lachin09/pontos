import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import {
  categoryService,
  getStoreSettings,
  productService,
} from "@/lib/server/storefront-services";

// Storefront reads are cached across requests and invalidated by tag from the
// admin routes (see lib/data/revalidate.ts). The time-based fallback covers
// changes made directly in the Supabase dashboard.
const FALLBACK_REVALIDATE_SECONDS = 300;

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
  () => getStoreSettings().getContactLinks(),
  ["storefront:contact-links"],
  { tags: [CACHE_TAGS.contactLinks], revalidate: FALLBACK_REVALIDATE_SECONDS },
);

export const getStoreInfo = unstable_cache(
  () => getStoreSettings().getStoreInfo(),
  ["storefront:store-info"],
  { tags: [CACHE_TAGS.storeInfo], revalidate: FALLBACK_REVALIDATE_SECONDS },
);
