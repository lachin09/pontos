"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { formatItemCount, formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const totalQuantity = useCartStore((state) => state.getTotalQuantity());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const removeItem = useCartStore((state) => state.removeItem);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  if (!hasHydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10 sm:py-14"
        aria-label="Завантаження кошика"
      >
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-4">
            {[0, 1].map((item) => (
              <Skeleton key={item} className="h-36 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[1440px] place-items-center px-page py-16 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-muted text-accent">
            <ShoppingBag size={23} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-medium">Кошик поки порожній</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Перегляньте колекцію та додайте речі, які вам сподобались.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            До каталогу <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 sm:mb-10">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
            PONTOS · essentials
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Кошик
          </h1>
          <p className="mt-2 text-sm text-muted">
            {formatItemCount(totalQuantity)}
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={clearCart}>
          <Trash2 size={16} aria-hidden="true" /> Очистити кошик
        </Button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <ul className="grid gap-4" aria-label="Товари в кошику">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="grid grid-cols-[92px_1fr] gap-4 border-b border-border pb-4 sm:grid-cols-[132px_1fr] sm:gap-6 sm:pb-6"
            >
              <Link
                href={`/product/${item.productSlug}`}
                className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-control)] bg-surface-muted"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="132px"
                    className="object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="line-clamp-2 text-sm font-medium hover:text-accent sm:text-base"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {item.color} · {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Видалити ${item.productName} з кошика`}
                    onClick={() => removeItem(item.variantId)}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex h-9 items-center rounded-[var(--radius-control)] border border-border bg-surface">
                    <button
                      type="button"
                      aria-label={`Зменшити кількість ${item.productName}`}
                      onClick={() => decreaseQuantity(item.variantId)}
                      disabled={item.quantity <= 1}
                      className="grid size-8 place-items-center text-foreground hover:text-accent disabled:opacity-40"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <output
                      aria-label="Кількість"
                      className="min-w-6 text-center text-xs tabular-nums"
                    >
                      {item.quantity}
                    </output>
                    <button
                      type="button"
                      aria-label={`Збільшити кількість ${item.productName}`}
                      onClick={() => increaseQuantity(item.variantId)}
                      disabled={item.quantity >= item.maxQuantity}
                      className="grid size-8 place-items-center text-foreground hover:text-accent disabled:opacity-40"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-medium">Підсумок</h2>
          <div className="mt-5 grid gap-3 border-b border-border pb-4 text-sm">
            <div className="flex justify-between gap-4 text-muted">
              <span>Товари ({totalQuantity})</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <span>Доставка</span>
              <span className="text-foreground">
                Розраховується при оформленні
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium">Разом за товари</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Перейти до оформлення <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-[0.7rem] leading-5 text-muted">
            Без реєстрації · Оплата переказом або при отриманні
          </p>
          <Link
            href="/catalog"
            className="mt-4 block text-center text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Продовжити покупки
          </Link>
        </aside>
      </div>
    </div>
  );
}
