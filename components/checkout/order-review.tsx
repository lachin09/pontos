import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCountryName } from "@/lib/constants/countries";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/utils/format";
import type { CheckoutData } from "@/lib/validators/checkout";

/** Which legal pages are published, so the consent note only links to real pages. */
export type PolicyLinks = { offer: boolean; privacy: boolean };

function ConsentNote({ policyLinks }: { policyLinks: PolicyLinks }) {
  const { t, href } = useI18n();
  const c = t.checkout;
  if (!policyLinks.offer && !policyLinks.privacy) return null;
  const link = (href: string, text: string) => (
    <Link
      href={href}
      target="_blank"
      className="underline underline-offset-4 hover:text-foreground"
    >
      {text}
    </Link>
  );
  return (
    <p className="mt-4 text-xs leading-5 text-muted">
      {c.consentPrefix}{" "}
      {policyLinks.offer ? link(href("/info/offer"), c.consentOffer) : null}
      {policyLinks.offer && policyLinks.privacy ? c.consentAnd : null}
      {policyLinks.privacy
        ? link(href("/info/privacy"), c.consentPrivacy)
        : null}
      .
    </p>
  );
}

export function OrderReview({
  data,
  subtotal,
  placing,
  error,
  onConfirm,
  onEdit,
  policyLinks,
}: {
  data: CheckoutData;
  subtotal: number;
  placing: boolean;
  error: string | null;
  onConfirm: () => void;
  onEdit: () => void;
  policyLinks: PolicyLinks;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
  return (
    <section
      className="max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7"
      aria-labelledby="review-heading"
    >
      <h2 id="review-heading" className="text-2xl">
        {c.reviewTitle}
      </h2>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">{c.buyer}</dt>
          <dd className="mt-1">
            {data.firstName} {data.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{c.phone}</dt>
          <dd className="mt-1">{data.phone}</dd>
        </div>
        <div>
          <dt className="text-muted">{c.city}</dt>
          <dd className="mt-1">
            {data.city}, {getCountryName(data.deliveryCountryCode, locale)}
            {data.deliveryPostalCode ? ` · ${data.deliveryPostalCode}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{c.delivery}</dt>
          <dd className="mt-1">
            {c.deliveryMethods[data.deliveryMethod]} · {data.deliveryAddress}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{c.payment}</dt>
          <dd className="mt-1">{c.paymentMethods[data.paymentMethod]}</dd>
        </div>
        {data.comment ? (
          <div className="sm:col-span-2">
            <dt className="text-muted">{c.commentLabel}</dt>
            <dd className="mt-1">{data.comment}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-5 rounded-md bg-surface-muted p-3 text-sm text-muted">
        {c.deliveryNote}
      </p>
      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          size="lg"
          loading={placing}
          loadingLabel={c.placing}
          onClick={onConfirm}
        >
          {fill(c.confirm, { total: formatPrice(subtotal) })}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={placing}
          onClick={onEdit}
        >
          <ArrowLeft size={16} aria-hidden="true" /> {c.edit}
        </Button>
      </div>
      <ConsentNote policyLinks={policyLinks} />
    </section>
  );
}
