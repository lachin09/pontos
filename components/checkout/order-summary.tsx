import { ArrowLeft, ChevronDown, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { discountAmount } from "@/lib/utils/discount";
import { colorName } from "@/lib/i18n/colors";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem } from "@/stores/cart.store";

function OrderLines({
  items,
  thumbnail,
}: {
  items: CartItem[];
  thumbnail: "sm" | "md";
}) {
  const { t, locale } = useI18n();
  const small = thumbnail === "sm";
  return (
    <>
      {items.map((item) => (
        <li key={item.variantId} className="flex items-center gap-3">
          <div
            className={`relative shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-muted ${small ? "size-12" : "size-14"}`}
          >
            {item.productImage ? (
              <Image
                src={item.productImage}
                alt={small ? "" : item.productName}
                fill
                sizes={small ? "48px" : "56px"}
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.productName}</p>
            <p className={`text-xs text-muted ${small ? "" : "mt-1"}`}>
              {colorName(item.color, locale)} · {item.size} · {item.quantity}{" "}
              {t.common.pcs}
            </p>
          </div>
          <span className="text-sm tabular-nums">
            {formatPrice(item.price * item.quantity)}
          </span>
        </li>
      ))}
    </>
  );
}

/** The first-customer discount lines, when the offer is still open. */
function DiscountLines({
  subtotal,
  discountPercent,
}: {
  subtotal: number;
  discountPercent: number;
}) {
  const { t } = useI18n();
  if (discountPercent <= 0) return null;
  return (
    <div className="mt-4 grid gap-1 text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-muted">
          {fill(t.checkout.summaryDiscount, {
            percent: String(discountPercent),
          })}
        </span>
        <span className="tabular-nums text-highlight">
          −{formatPrice(discountAmount(subtotal, discountPercent))}
        </span>
      </div>
      <p className="text-xs text-muted">{t.checkout.summaryDiscountNote}</p>
    </div>
  );
}

/** Collapsed one-line summary for phones. */
export function OrderSummaryCompact({
  items,
  subtotal,
  discountPercent = 0,
}: {
  items: CartItem[];
  subtotal: number;
  discountPercent?: number;
}) {
  const { t, plural } = useI18n();
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const toPay = subtotal - discountAmount(subtotal, discountPercent);
  return (
    <details className="group order-1 rounded-[var(--radius-card)] border border-border bg-surface lg:hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-medium">
          <ShoppingBag size={16} className="text-accent" aria-hidden="true" />
          {t.checkout.yourOrder} · {quantity} {plural(quantity, t.common.items)}
          <ChevronDown
            size={16}
            className="text-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
        <span className="font-semibold tabular-nums">{formatPrice(toPay)}</span>
      </summary>
      <ul className="grid gap-3 border-t border-border p-4">
        <OrderLines items={items} thumbnail="sm" />
      </ul>
      {discountPercent > 0 ? (
        <div className="border-t border-border px-4 pb-4">
          <DiscountLines
            subtotal={subtotal}
            discountPercent={discountPercent}
          />
        </div>
      ) : null}
    </details>
  );
}

/** Sticky sidebar summary for large screens. */
export function OrderSummaryAside({
  items,
  subtotal,
  discountPercent = 0,
}: {
  items: CartItem[];
  subtotal: number;
  discountPercent?: number;
}) {
  const { t, href } = useI18n();
  const toPay = subtotal - discountAmount(subtotal, discountPercent);
  return (
    <aside className="hidden rounded-[var(--radius-card)] border border-border bg-surface p-6 lg:order-2 lg:sticky lg:top-24 lg:block">
      <h2 className="text-lg font-medium">{t.checkout.yourOrder}</h2>
      <ul className="mt-5 grid gap-4 border-b border-border pb-5">
        <OrderLines items={items} thumbnail="md" />
      </ul>
      <div className="mt-4 flex justify-between gap-3 text-sm">
        <span className="text-muted">{t.checkout.delivery}</span>
        <span className="text-right">{t.checkout.summaryDelivery}</span>
      </div>
      <DiscountLines subtotal={subtotal} discountPercent={discountPercent} />
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="font-medium">
          {discountPercent > 0 ? t.checkout.summaryToPay : t.checkout.total}
        </span>
        <span className="text-lg font-semibold tabular-nums">
          {formatPrice(toPay)}
        </span>
      </div>
      <Link
        href={href("/cart")}
        className="mt-5 inline-flex items-center gap-2 text-xs text-muted underline underline-offset-4 hover:text-foreground"
      >
        <ArrowLeft size={14} aria-hidden="true" /> {t.checkout.backToCart}
      </Link>
    </aside>
  );
}
