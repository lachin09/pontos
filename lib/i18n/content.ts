import type { Locale } from "@/lib/i18n/config";

/**
 * Catalogue text in the other languages, stored in the `translations` jsonb
 * column: { ru: { name, description, … }, en: { … } }. Ukrainian stays in the
 * regular columns and is the fallback for anything missing.
 */
export type ContentLocale = Exclude<Locale, "uk">;
export const CONTENT_LOCALES: ContentLocale[] = ["ru", "en"];

export type Translations<Field extends string> = Partial<
  Record<ContentLocale, Partial<Record<Field, string>>>
>;

export const PRODUCT_TEXT_FIELDS = [
  "name",
  "description",
  "composition",
  "careInstructions",
] as const;
export type ProductTextField = (typeof PRODUCT_TEXT_FIELDS)[number];

export const CATEGORY_TEXT_FIELDS = ["name", "description"] as const;
export type CategoryTextField = (typeof CATEGORY_TEXT_FIELDS)[number];

/** Keeps only known languages and non-empty string fields. */
export function parseTranslations<Field extends string>(
  value: unknown,
  fields: readonly Field[],
): Translations<Field> {
  const result: Translations<Field> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return result;
  }
  for (const locale of CONTENT_LOCALES) {
    const entry = (value as Record<string, unknown>)[locale];
    if (!entry || typeof entry !== "object") continue;
    const clean: Partial<Record<Field, string>> = {};
    for (const field of fields) {
      const text = (entry as Record<string, unknown>)[field];
      if (typeof text === "string" && text.trim()) clean[field] = text;
    }
    if (Object.keys(clean).length > 0) result[locale] = clean;
  }
  return result;
}

/** The text of `field` in `locale`, or the Ukrainian original. */
export function localizedText<Field extends string>(
  original: string,
  translations: Translations<Field> | undefined,
  field: Field,
  locale: Locale,
): string {
  if (locale === "uk") return original;
  // Data cached before translations existed has no field at all.
  return translations?.[locale]?.[field]?.trim() || original;
}
