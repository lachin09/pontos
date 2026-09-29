import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";

/**
 * The current storefront language and its dictionary, for Server Components.
 * The locale comes from the [lang] root segment, so callers pass nothing.
 */
export async function getI18n() {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return i18nFor(value);
}
