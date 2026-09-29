import type { ReactNode } from "react";
import { parseRichText } from "@/components/content/rich-text";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";

const SPEC_LINE = /^([^:]{2,30}):\s+(.+)$/;

/**
 * Product text in the admin's plain-text format, laid out like a boutique
 * card: the first paragraph as a serif lead, "- " lines as details, and
 * paragraphs made only of "Назва: значення" lines as a specification grid.
 * `extraSpecs` (material, colour) come from product data and lead the grid.
 */
export function ProductDescription({
  source,
  extraSpecs = [],
  locale = DEFAULT_LOCALE,
}: {
  source: string;
  extraSpecs?: { label: string; value: string }[];
  locale?: Locale;
}) {
  const { t } = i18nFor(locale);
  const blocks = parseRichText(source);
  const specs = [...extraSpecs];
  const content: ReactNode[] = [];
  let hasLead = false;

  blocks.forEach((block, index) => {
    if (
      block.kind === "paragraph" &&
      block.lines.every((line) => SPEC_LINE.test(line))
    ) {
      for (const line of block.lines) {
        const [, label, value] = line.match(SPEC_LINE) ?? [];
        if (label && value) specs.push({ label, value });
      }
      return;
    }
    if (block.kind === "list") {
      content.push(
        <div key={index}>
          <p className="eyebrow mb-3">{t.product.details}</p>
          <ul className="grid gap-2.5">
            {block.items.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="flex gap-3 text-sm leading-6 text-foreground/80"
              >
                <span
                  className="mt-3 h-px w-3 shrink-0 bg-gold"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>,
      );
      return;
    }
    if (block.kind === "heading") {
      content.push(
        <p key={index} className="eyebrow">
          {block.text}
        </p>,
      );
      return;
    }
    const text = block.lines.join(" ");
    if (!hasLead) {
      hasLead = true;
      content.push(
        <p
          key={index}
          className="font-serif text-[1.3rem] leading-snug text-foreground sm:text-[1.4rem]"
        >
          {text}
        </p>,
      );
    } else {
      content.push(
        <p key={index} className="text-sm leading-7 text-foreground/80">
          {text}
        </p>,
      );
    }
  });

  return (
    <div className="grid gap-6">
      {content}
      {specs.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5">
          {specs.map((spec) => (
            <div key={spec.label}>
              <dt className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted">
                {spec.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground first-letter:uppercase">
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
