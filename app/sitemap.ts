import type { MetadataRoute } from "next";
import { getPublishedProducts, getStoreInfo } from "@/lib/data/storefront";
import { LOCALES, LOCALE_TAGS, localizedPath } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";
import { INFO_PAGE_SLUGS } from "@/lib/validators/store-info";

/** One entry per page in the default language, with its other languages. */
function entry(
  path: string,
  extra: Partial<MetadataRoute.Sitemap[number]> = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${localizedPath(path, "uk")}`,
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [
          LOCALE_TAGS[locale],
          `${SITE_URL}${localizedPath(path, locale)}`,
        ]),
      ),
    },
    ...extra,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, info] = await Promise.all([
    getPublishedProducts().catch(() => []),
    getStoreInfo().catch(() => null),
  ]);
  const infoPages = INFO_PAGE_SLUGS.filter((slug) => info?.pages[slug].trim());
  return [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/catalog", { changeFrequency: "daily", priority: 0.9 }),
    ...products.map((product) =>
      entry(`/product/${product.slug}`, {
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    ),
    ...infoPages.map((slug) =>
      entry(`/info/${slug}`, { changeFrequency: "monthly", priority: 0.3 }),
    ),
  ];
}
