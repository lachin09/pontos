import type { Locale } from "@/lib/i18n/config";
import type { SellerInfo } from "@/lib/validators/store-info";

/** The showroom address in the visitor's language, falling back to Ukrainian. */
export function showroomAddress(seller: SellerInfo, locale: Locale): string {
  const localized = (
    locale === "ru" ? seller.addressRu : locale === "en" ? seller.addressEn : ""
  ).trim();
  return localized || seller.address.trim();
}

/** Where clicking the address leads: the admin's map link or a Google Maps search. */
export function showroomMapHref(seller: SellerInfo): string | undefined {
  if (seller.mapUrl) return seller.mapUrl;
  const address = seller.address.trim();
  if (!address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** The address without a trailing landmark in parentheses, for tight spots like the top bar. */
export function shortAddress(address: string): string {
  return address.replace(/\s*\([^()]*\)\s*$/, "").trim() || address;
}
