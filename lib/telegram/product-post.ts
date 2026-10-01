import { isInStock, uniqueColors, uniqueSizes } from "@/lib/product/variants";
import { MAX_ALBUM_PHOTOS } from "@/lib/telegram/bot";
import { escape, money } from "@/lib/telegram/messages";
import type { AdminProductDetails } from "@/repositories/product.repository";
import type { ProductImage } from "@/types/product";

/** Telegram rejects photo captions longer than this. */
const CAPTION_LIMIT = 1024;
const LEAD_LIMIT = 300;

export type PostableProduct = Pick<
  AdminProductDetails,
  "name" | "slug" | "description" | "price" | "oldPrice" | "variants"
>;

/**
 * The photos for the post, in their saved order. When there are more than
 * fit in one album, every colour keeps its first photos rather than the
 * first colours taking all the room.
 */
export function albumPhotos(
  images: Pick<ProductImage, "url" | "color">[],
  limit = MAX_ALBUM_PHOTOS,
): string[] {
  if (images.length <= limit) return images.map((image) => image.url);
  const byColor = new Map<string, typeof images>();
  for (const image of images) {
    const color = (image.color ?? "").trim().toLowerCase();
    byColor.set(color, [...(byColor.get(color) ?? []), image]);
  }
  const chosen = new Set<(typeof images)[number]>();
  for (let round = 0; chosen.size < limit; round++) {
    for (const photos of byColor.values()) {
      if (photos[round] && chosen.size < limit) chosen.add(photos[round]);
    }
  }
  return images.filter((image) => chosen.has(image)).map((image) => image.url);
}

/** Cuts at a word boundary and marks the cut with an ellipsis. */
function shorten(text: string, limit: number) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

/**
 * The caption under a product's photos in the store's Telegram channel
 * (HTML parse mode, Ukrainian): name, the first paragraph of the
 * description, price, what is in stock and a link to the product page.
 */
export function productPostCaption(
  product: PostableProduct,
  siteUrl: string | null,
) {
  const inStock = product.variants.filter(isInStock);
  const sizes = uniqueSizes(inStock).map(escape);
  const colors = uniqueColors(inStock).map((variant) => escape(variant.color));
  const price =
    product.oldPrice && product.oldPrice > product.price
      ? `<s>${money(product.oldPrice)}</s> <b>${money(product.price)}</b>`
      : `<b>${money(product.price)}</b>`;
  const details = [
    `Ціна: ${price}`,
    sizes.length > 0
      ? `${sizes.length > 1 ? "Розміри" : "Розмір"}: ${sizes.join(", ")}`
      : "",
    colors.length > 0
      ? `${colors.length > 1 ? "Кольори" : "Колір"}: ${colors.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const title = `<b>${escape(product.name)}</b>`;
  const link = siteUrl
    ? `<a href="${siteUrl}/product/${product.slug}">Переглянути на сайті</a>`
    : "";

  // The description gets whatever room the fixed parts leave.
  const fixed = [title, details, link].filter(Boolean).join("\n\n").length;
  const room = Math.min(LEAD_LIMIT, CAPTION_LIMIT - fixed - 2);
  const firstParagraph = product.description.split(/\n\s*\n/)[0].trim();
  const lead =
    firstParagraph && room >= 40 ? escape(shorten(firstParagraph, room)) : "";

  return [title, lead, details, link].filter(Boolean).join("\n\n");
}
