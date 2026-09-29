"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_TAGS,
  splitLocale,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Links to the current page in each language. Ukrainian goes through /uk/…
 * so the proxy can remember the choice before dropping the prefix. Plain
 * <a> tags: switching language reloads the page with the new root layout.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const { path } = splitLocale(usePathname() ?? "/");
  const target = (next: Locale) =>
    path === "/" ? `/${next}` : `/${next}${path}`;

  return (
    <nav aria-label={t.header.language} className={className}>
      <ul className="flex items-center gap-1">
        {LOCALES.map((option, index) => (
          <li key={option} className="flex items-center gap-1">
            {index > 0 ? (
              <span className="text-current/30" aria-hidden="true">
                /
              </span>
            ) : null}
            <a
              href={target(option)}
              hrefLang={LOCALE_TAGS[option]}
              lang={LOCALE_TAGS[option]}
              aria-current={option === locale ? "true" : undefined}
              className="px-0.5 transition-colors hover:text-gold aria-[current=true]:font-semibold aria-[current=true]:text-current"
            >
              {LOCALE_LABELS[option]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
