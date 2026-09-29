"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { i18nFor, type I18n } from "@/lib/i18n/translator";

const I18nContext = createContext<Locale>(DEFAULT_LOCALE);

/** Makes the page language available to Client Components. */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <I18nContext value={locale}>{children}</I18nContext>;
}

/** The current language, its dictionary and helpers, for Client Components. */
export function useI18n(): I18n {
  const locale = useContext(I18nContext);
  return useMemo(() => i18nFor(locale), [locale]);
}
