import { localizedPath, type Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";
import type { SellerInfo } from "@/lib/validators/store-info";
import type { Product } from "@/types/product";

const ORGANIZATION = {
  "@type": "Organization",
  name: "PONTOS",
  url: SITE_URL,
};

/** A product page as schema.org Product + Offer, for rich search results. */
export function productJsonLd(
  product: Product,
  locale: Locale,
  categoryName?: string,
) {
  const url = `${SITE_URL}${localizedPath(`/product/${product.slug}`, locale)}`;
  const inStock = product.variants.some(
    (variant) => variant.isAvailable && variant.stock > 0,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description.split("\n\n")[0],
    image: product.images.map((image) => image.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "PONTOS" },
    ...(product.composition ? { material: product.composition } : {}),
    ...(categoryName ? { category: categoryName } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: product.price.toFixed(2),
      priceCurrency: "UAH",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: ORGANIZATION,
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path?: string }[],
  locale: Locale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? { item: `${SITE_URL}${localizedPath(item.path, locale)}` }
        : {}),
    })),
  };
}

const DAY_CODES: Record<string, string> = {
  пн: "Mo",
  вт: "Tu",
  ср: "We",
  чт: "Th",
  пт: "Fr",
  сб: "Sa",
  нд: "Su",
};

/** "Пн-Нд 10:00-19:00" → "Mo-Su 10:00-19:00"; anything else is left out. */
function openingHours(text: string): string | undefined {
  const match = text
    .toLowerCase()
    .match(
      /^(пн|вт|ср|чт|пт|сб|нд)\s*[-–]\s*(пн|вт|ср|чт|пт|сб|нд)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/u,
    );
  if (!match) return undefined;
  return `${DAY_CODES[match[1]]}-${DAY_CODES[match[2]]} ${match[3]}-${match[4]}`;
}

/** The shop itself: a ClothingStore with its showroom, for local search. */
export function storeJsonLd(seller: SellerInfo, sameAs: string[]) {
  const hours = seller.workingHours && openingHours(seller.workingHours);
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "PONTOS",
    url: SITE_URL,
    image: `${SITE_URL}/apple-icon.png`,
    ...(seller.phone ? { telephone: seller.phone } : {}),
    ...(seller.email ? { email: seller.email } : {}),
    ...(seller.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: seller.address,
            addressLocality: "Київ",
            addressCountry: "UA",
          },
        }
      : {}),
    ...(hours ? { openingHours: hours } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    currenciesAccepted: "UAH",
    paymentAccepted: "Cash, Bank transfer",
  };
}
