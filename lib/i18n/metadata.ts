import type { Metadata } from "next";
import { LOCALES, LOCALE_TAGS, localizedPath } from "@/lib/i18n/config";

/**
 * hreflang links so search engines index each language version of a page.
 * `path` is the page without a language prefix, e.g. "/catalog".
 */
export function languageAlternates(path: string): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((locale) => [LOCALE_TAGS[locale], localizedPath(path, locale)]),
  );
  languages["x-default"] = localizedPath(path, "uk");
  return { languages };
}
