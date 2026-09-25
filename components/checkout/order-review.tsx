import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCountryName } from "@/lib/constants/countries";
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants/order-labels";
import { formatPrice } from "@/lib/utils/format";
import type { CheckoutData } from "@/lib/validators/checkout";

/** Which legal pages are published, so the consent note only links to real pages. */
export type PolicyLinks = { offer: boolean; privacy: boolean };

function ConsentNote({ policyLinks }: { policyLinks: PolicyLinks }) {
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
      Підтверджуючи замовлення, ви погоджуєтеся з{" "}
      {policyLinks.offer
        ? link("/info/offer", "умовами публічної оферти")
        : null}
      {policyLinks.offer && policyLinks.privacy ? " та " : null}
      {policyLinks.privacy
        ? link("/info/privacy", "політикою конфіденційності")
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
  return (
    <section
      className="max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7"
      aria-labelledby="review-heading"
    >
      <h2 id="review-heading" className="text-2xl">
        Перевірте дані
      </h2>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Покупець</dt>
          <dd className="mt-1">
            {data.firstName} {data.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Телефон</dt>
          <dd className="mt-1">{data.phone}</dd>
        </div>
        <div>
          <dt className="text-muted">Місто</dt>
          <dd className="mt-1">
            {data.city}, {getCountryName(data.deliveryCountryCode)}
            {data.deliveryPostalCode ? ` · ${data.deliveryPostalCode}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Доставка</dt>
          <dd className="mt-1">
            {DELIVERY_METHOD_LABELS[data.deliveryMethod]} ·{" "}
            {data.deliveryAddress}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Оплата</dt>
          <dd className="mt-1">{PAYMENT_METHOD_LABELS[data.paymentMethod]}</dd>
        </div>
        {data.comment ? (
          <div className="sm:col-span-2">
            <dt className="text-muted">Коментар</dt>
            <dd className="mt-1">{data.comment}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-5 rounded-md bg-surface-muted p-3 text-sm text-muted">
        Доставка оплачується окремо перевізнику під час отримання. Підсумкова
        вартість доставки залежить від тарифу перевізника.
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
          loadingLabel="Оформлюємо замовлення"
          onClick={onConfirm}
        >
          Підтвердити замовлення · {formatPrice(subtotal)}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={placing}
          onClick={onEdit}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Змінити дані
        </Button>
      </div>
      <ConsentNote policyLinks={policyLinks} />
    </section>
  );
}
