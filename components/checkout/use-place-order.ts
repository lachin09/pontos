"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { ordersApi, type OrderConfirmation } from "@/lib/api/storefront";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { CheckoutData } from "@/lib/validators/checkout";
import type { CartItem } from "@/stores/cart.store";

/**
 * Placing an order. A single idempotency key covers one review, so a
 * double-click or a retry after a timeout never creates two orders.
 */
/**
 * The order API answers in Ukrainian. Known messages are shown in the page
 * language; anything else becomes the generic "could not place" message.
 */
export function orderErrorMessage(message: string, locale: Locale): string {
  if (locale === "uk") return message;
  const uk = getDictionary("uk").checkout.errors;
  const errors = getDictionary(locale).checkout.errors;
  const key = (Object.keys(uk) as (keyof typeof uk)[]).find(
    (candidate) => uk[candidate] === message,
  );
  return key ? errors[key] : errors.failed;
}

export function usePlaceOrder({ onPlaced }: { onPlaced: () => void }) {
  const { t, locale } = useI18n();
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  );

  return {
    placing,
    error,
    confirmation,

    /** Call when the shopper moves on to review their details. */
    startReview() {
      setError(null);
      setIdempotencyKey(crypto.randomUUID());
    },

    /** Call when the shopper goes back to edit; the next review gets a new key. */
    cancelReview() {
      setError(null);
      setIdempotencyKey(null);
    },

    async place(customer: CheckoutData, items: CartItem[]) {
      if (placing || items.length === 0) return;
      setPlacing(true);
      setError(null);
      const key = idempotencyKey ?? crypto.randomUUID();
      setIdempotencyKey(key);
      try {
        const placed = await ordersApi.place(
          {
            customer,
            items: items.map(({ variantId, quantity }) => ({
              variantId,
              quantity,
            })),
          },
          key,
        );
        setConfirmation(placed);
        setIdempotencyKey(null);
        onPlaced();
      } catch (caught) {
        setError(
          caught instanceof ApiError && caught.status !== 0
            ? orderErrorMessage(caught.message, locale)
            : t.checkout.errors.network,
        );
      } finally {
        setPlacing(false);
      }
    },
  };
}
