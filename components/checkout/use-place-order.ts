"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { ordersApi, type OrderConfirmation } from "@/lib/api/storefront";
import type { CheckoutData } from "@/lib/validators/checkout";
import type { CartItem } from "@/stores/cart.store";

/**
 * Placing an order. A single idempotency key covers one review, so a
 * double-click or a retry after a timeout never creates two orders.
 */
export function usePlaceOrder({ onPlaced }: { onPlaced: () => void }) {
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
            ? caught.message
            : "Не вдалося оформити замовлення через з’єднання. Спробуйте ще раз.",
        );
      } finally {
        setPlacing(false);
      }
    },
  };
}
