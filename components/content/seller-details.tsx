import { AddressLink } from "@/components/layout/address-link";
import { showroomAddress, showroomMapHref } from "@/lib/content/showroom";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";
import { telHref } from "@/lib/utils/format";
import type { SellerInfo } from "@/lib/validators/store-info";

/** The seller's legal details; rows the admin left empty are skipped. */
export function SellerDetails({
  seller,
  locale = DEFAULT_LOCALE,
}: {
  seller: SellerInfo;
  locale?: Locale;
}) {
  const { t } = i18nFor(locale);
  const mapHref = showroomMapHref(seller);
  const rows = (
    [
      ["seller", seller.legalName],
      ["taxId", seller.taxId],
      ["address", showroomAddress(seller, locale)],
      ["phone", seller.phone],
      ["email", seller.email],
      ["hours", seller.workingHours],
    ] as const
  ).filter(([, value]) => value);

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-sm sm:grid-cols-2 sm:p-6">
      {rows.map(([field, value]) => (
        <div key={field}>
          <dt className="text-xs text-muted">{t.info.rows[field]}</dt>
          <dd className="mt-1 font-medium">
            {field === "phone" ? (
              <a href={telHref(value)} className="hover:text-accent">
                {value}
              </a>
            ) : field === "email" ? (
              <a href={`mailto:${value}`} className="hover:text-accent">
                {value}
              </a>
            ) : field === "address" && mapHref ? (
              <AddressLink
                address={value}
                href={mapHref}
                label={t.header.openMap}
                className="inline-flex items-start gap-1.5 hover:text-accent"
                iconClassName="mt-1 shrink-0 text-gold"
              />
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
