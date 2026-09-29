"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/stores/cart.store";

export function CartLink() {
  const { t, href, plural } = useI18n();
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const quantity = useCartStore((state) => state.getTotalQuantity());

  return (
    <Link
      href={href("/cart")}
      aria-label={
        hasHydrated && quantity > 0
          ? fill(t.header.cartWithCount, {
              count: `${quantity} ${plural(quantity, t.common.items)}`,
            })
          : t.header.cart
      }
      className="relative grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-muted"
    >
      <ShoppingBag size={19} aria-hidden="true" />
      {hasHydrated && quantity > 0 ? (
        <span
          key={quantity}
          className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 animate-rise place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-none text-accent-foreground"
        >
          {quantity > 99 ? "99+" : quantity}
        </span>
      ) : null}
    </Link>
  );
}
