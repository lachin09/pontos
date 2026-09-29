/**
 * Storefront languages. Ukrainian is the main language and lives at the plain
 * URLs (/catalog); the others are prefixed (/ru/catalog, /en/catalog).
 * Internally every storefront route sits under app/[lang], and proxy.ts
 * rewrites the plain URLs to /uk/….
 */
export const LOCALES = ["uk", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uk";

/** Remembers the last language the visitor picked explicitly. */
export const LOCALE_COOKIE = "pontos-lang";

export const LOCALE_LABELS: Record<Locale, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

/** BCP 47 tags for <html lang> and hreflang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  uk: "uk-UA",
  ru: "ru-UA",
  en: "en",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Public URL of a storefront path in a language: ("/catalog", "ru") → "/ru/catalog". */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Splits a public pathname into its language and the path without it. */
export function splitLocale(pathname: string): {
  locale: Locale;
  path: string;
} {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * Picks the first supported language from an Accept-Language header,
 * honouring q-values. Anything unsupported falls back to Ukrainian.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        q: q ? Number(q.trim().slice(2)) || 0 : 1,
        index,
      };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { language } of ranked) {
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

/** Plural form picker: [one, few, many]. English uses one / other. */
export function pluralForm(
  locale: Locale,
  count: number,
  [one, few, many]: readonly [string, string, string],
): string {
  if (locale === "en") return count === 1 ? one : many;
  const remainder = count % 100;
  const lastDigit = count % 10;
  if (remainder >= 11 && remainder <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}
