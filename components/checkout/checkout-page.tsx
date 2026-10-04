"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";
import {
  OrderReview,
  type PolicyLinks,
} from "@/components/checkout/order-review";
import {
  OrderSummaryAside,
  OrderSummaryCompact,
} from "@/components/checkout/order-summary";
import { usePlaceOrder } from "@/components/checkout/use-place-order";
import { buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckoutData } from "@/lib/validators/checkout";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";

/** The heading each stage opens with; it receives focus when the stage changes. */
const STAGE_HEADINGS = {
  1: "checkout-heading",
  2: "review-heading",
  3: "confirmation-heading",
} as const;

/** Sequences checkout: details form → review → confirmation. */
export function CheckoutPage({
  policyLinks,
  discountPercent = 0,
}: {
  policyLinks: PolicyLinks;
  /** First-customer discount still on offer; 0 when none. */
  discountPercent?: number;
}) {
  const { t, href } = useI18n();
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const savedData = useCheckoutStore((state) => state.data);
  const setData = useCheckoutStore((state) => state.setData);
  const clearCheckout = useCheckoutStore((state) => state.clear);
  const [reviewing, setReviewing] = useState(false);
  const order = usePlaceOrder({
    onPlaced() {
      clearCart();
      clearCheckout();
    },
  });
  const step = order.confirmation ? 3 : reviewing ? 2 : 1;
  const previousStep = useRef(step);

  // Each stage starts at the top. This runs after the new stage has rendered:
  // scrolling before the long form is replaced leaves phones at the bottom.
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    window.scrollTo({ top: 0, behavior: "instant" });
    document
      .getElementById(STAGE_HEADINGS[step])
      ?.focus({ preventScroll: true });
  }, [step]);

  if (!hasHydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10"
        aria-label={t.checkout.loading}
      >
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[560px] w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  // After a successful order the cart is empty but the confirmation must stay.
  if (items.length === 0 && !order.confirmation) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[1440px] place-items-center px-page py-16 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface-muted text-accent">
            <ShoppingBag size={26} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl">{t.checkout.emptyTitle}</h1>
          <p className="mt-3 text-sm text-muted">{t.checkout.emptyText}</p>
          <Link
            className={buttonClasses({ size: "lg", className: "mt-7" })}
            href={href("/catalog")}
          >
            {t.common.toCatalog} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  function review(data: CheckoutData) {
    setData(data);
    order.startReview();
    setReviewing(true);
  }

  function edit() {
    order.cancelReview();
    setReviewing(false);
  }

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-8 sm:py-12">
      <div className="mb-6 border-b border-border pb-6 sm:mb-8">
        <p className="eyebrow">PONTOS</p>
        <h1
          id="checkout-heading"
          tabIndex={-1}
          className="mt-2 text-4xl leading-tight outline-none sm:text-5xl"
        >
          {order.confirmation ? t.checkout.thanks : t.checkout.title}
        </h1>
        <CheckoutSteps current={step} />
      </div>

      {order.confirmation ? (
        <OrderConfirmation confirmation={order.confirmation} />
      ) : reviewing && savedData ? (
        <OrderReview
          data={savedData}
          subtotal={subtotal}
          discountPercent={discountPercent}
          placing={order.placing}
          error={order.error}
          onConfirm={() => void order.place(savedData, items)}
          onEdit={edit}
          policyLinks={policyLinks}
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <CheckoutForm initialData={savedData} onValid={review} />
          <OrderSummaryCompact
            items={items}
            subtotal={subtotal}
            discountPercent={discountPercent}
          />
          <OrderSummaryAside
            items={items}
            subtotal={subtotal}
            discountPercent={discountPercent}
          />
        </div>
      )}
    </div>
  );
}
