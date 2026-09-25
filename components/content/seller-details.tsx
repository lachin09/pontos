import type { SellerInfo } from "@/lib/validators/store-info";

/** The seller's legal details; rows the admin left empty are skipped. */
export function SellerDetails({ seller }: { seller: SellerInfo }) {
  const rows = [
    ["Продавець", seller.legalName],
    ["РНОКПП / ЄДРПОУ", seller.taxId],
    ["Адреса", seller.address],
    ["Телефон", seller.phone],
    ["E-mail", seller.email],
    ["Графік роботи", seller.workingHours],
  ].filter(([, value]) => value);

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-sm sm:grid-cols-2 sm:p-6">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-1 font-medium">
            {label === "Телефон" ? (
              <a
                href={`tel:${value.replace(/[^\d+]/g, "")}`}
                className="hover:text-accent"
              >
                {value}
              </a>
            ) : label === "E-mail" ? (
              <a href={`mailto:${value}`} className="hover:text-accent">
                {value}
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
