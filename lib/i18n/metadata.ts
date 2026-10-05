import type { Metadata } from "next";
import {
  LOCALES,
  LOCALE_TAGS,
  localizedPath,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Canonical and hreflang links so search engines index each language
 * version of a page once. `path` is the page without a language prefix,
 * e.g. "/catalog". The root layout's metadataBase makes them absolute.
 */
export function languageAlternates(
  path: string,
  locale?: Locale,
): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((item) => [LOCALE_TAGS[item], localizedPath(path, item)]),
  );
  languages["x-default"] = localizedPath(path, "uk");
  return {
    ...(locale ? { canonical: localizedPath(path, locale) } : {}),
    languages,
  };
}
