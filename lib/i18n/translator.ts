import {
  DEFAULT_LOCALE,
  localizedPath,
  pluralForm,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/** Dictionary and helpers for one language; usable anywhere. */
export function i18nFor(locale: Locale = DEFAULT_LOCALE) {
  return {
    locale,
    t: getDictionary(locale),
    href: (path: string) => localizedPath(path, locale),
    plural: (count: number, forms: readonly [string, string, string]) =>
      pluralForm(locale, count, forms),
  };
}

export type I18n = ReturnType<typeof i18nFor>;
