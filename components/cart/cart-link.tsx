"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatItemCount } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart.store";

export function CartLink() {
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const quantity = useCartStore((state) => state.getTotalQuantity());

  return (
    <Link
      href="/cart"
      aria-label={
        hasHydrated && quantity > 0
          ? `Кошик, ${formatItemCount(quantity)}`
          : "Кошик"
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
