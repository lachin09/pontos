/** The public address of the storefront, used for canonical and sitemap URLs. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pontos.com.ua"
).replace(/\/+$/, "");
