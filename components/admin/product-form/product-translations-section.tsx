"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateProductField } from "@/components/admin/product-form/use-product-draft";
import type { ProductDraft } from "@/components/admin/product-form/types";
import type { ContentLocale, ProductTextField } from "@/lib/i18n/content";

const LANGUAGES: { locale: ContentLocale; label: string }[] = [
  { locale: "ru", label: "Русский" },
  { locale: "en", label: "English" },
];

/**
 * Russian and English versions of the product text. Anything left empty is
 * shown in Ukrainian on that language's version of the site.
 */
export function ProductTranslationsSection({
  draft,
  update,
}: {
  draft: ProductDraft;
  update: UpdateProductField;
}) {
  const set = (locale: ContentLocale, field: ProductTextField, value: string) =>
    update("translations", {
      ...draft.translations,
      [locale]: { ...draft.translations[locale], [field]: value },
    });

  return (
    <section className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-medium">Переклади</h2>
        <p className="mt-1 text-sm text-muted">
          Російська та англійська версії сайту. Порожні поля показуються
          українською.
        </p>
      </div>
      {LANGUAGES.map(({ locale, label }) => {
        const text = draft.translations[locale];
        const filled = Object.values(text).filter((value) =>
          value.trim(),
        ).length;
        return (
          <details
            key={locale}
            className="group rounded-[var(--radius-control)] border border-border"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              {label}
              <span className="text-xs font-normal text-muted">
                {filled > 0 ? `Заповнено полів: ${filled} з 4` : "Не заповнено"}
              </span>
            </summary>
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  id={`product-name-${locale}`}
                  label={`Назва (${label})`}
                  maxLength={200}
                  value={text.name}
                  placeholder={draft.name}
                  onChange={(event) => set(locale, "name", event.target.value)}
                />
              </div>
              <Textarea
                id={`product-description-${locale}`}
                label={`Опис (${label})`}
                className="sm:col-span-2"
                maxLength={10000}
                value={text.description}
                onChange={(event) =>
                  set(locale, "description", event.target.value)
                }
              />
              <Textarea
                id={`product-composition-${locale}`}
                label={`Склад (${label})`}
                maxLength={2000}
                value={text.composition}
                placeholder={draft.composition}
                onChange={(event) =>
                  set(locale, "composition", event.target.value)
                }
              />
              <Textarea
                id={`product-care-${locale}`}
                label={`Догляд (${label})`}
                maxLength={2000}
                value={text.careInstructions}
                placeholder={draft.care_instructions}
                onChange={(event) =>
                  set(locale, "careInstructions", event.target.value)
                }
              />
            </div>
          </details>
        );
      })}
    </section>
  );
}
