"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { CheckoutData } from "@/lib/validators/checkout";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

/** Sequences checkout: details form → review → confirmation. */
export function CheckoutPage({ policyLinks }: { policyLinks: PolicyLinks }) {
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
      scrollToTop();
    },
  });

  if (!hasHydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10"
        aria-label="Завантаження оформлення"
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
          <h1 className="mt-6 text-3xl sm:text-4xl">Кошик порожній</h1>
          <p className="mt-3 text-sm text-muted">
            Додайте товари, щоб перейти до оформлення.
          </p>
          <Link
            className={buttonClasses({ size: "lg", className: "mt-7" })}
            href="/catalog"
          >
            До каталогу <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  function review(data: CheckoutData) {
    setData(data);
    order.startReview();
    setReviewing(true);
    scrollToTop();
  }

  function edit() {
    order.cancelReview();
    setReviewing(false);
  }

  const step = order.confirmation ? 3 : reviewing ? 2 : 1;

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-8 sm:py-12">
      <div className="mb-6 border-b border-border pb-6 sm:mb-8">
        <p className="eyebrow">PONTOS · essentials</p>
        <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">
          {order.confirmation ? "Дякуємо!" : "Оформлення замовлення"}
        </h1>
        <CheckoutSteps current={step} />
      </div>

      {order.confirmation ? (
        <OrderConfirmation confirmation={order.confirmation} />
      ) : reviewing && savedData ? (
        <OrderReview
          data={savedData}
          subtotal={subtotal}
          placing={order.placing}
          error={order.error}
          onConfirm={() => void order.place(savedData, items)}
          onEdit={edit}
          policyLinks={policyLinks}
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <CheckoutForm initialData={savedData} onValid={review} />
          <OrderSummaryCompact items={items} subtotal={subtotal} />
          <OrderSummaryAside items={items} subtotal={subtotal} />
        </div>
      )}
    </div>
  );
}
