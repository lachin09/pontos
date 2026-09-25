"use client";

import { ProductPhoto } from "@/components/product/product-photo";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { formatItemCount, formatPrice } from "@/lib/utils/format";
import { Button, buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
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
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface-muted text-accent">
            <ShoppingBag size={26} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl">Кошик поки порожній</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
            Перегляньте колекцію та додайте речі, які вам сподобались.
          </p>
          <Link
            href="/catalog"
            className={buttonClasses({ size: "lg", className: "mt-7" })}
          >
            До каталогу <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-page pb-28 pt-8 sm:py-12 lg:pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6 sm:mb-10">
        <div>
          <p className="eyebrow">PONTOS · essentials</p>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">Кошик</h1>
          <p className="mt-2 text-sm text-muted">
            {formatItemCount(totalQuantity)}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div>
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
                    <ProductPhoto
                      src={item.productImage}
                      alt={item.productName}
                      sizes="132px"
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
                      className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <QuantityStepper
                      size="md"
                      value={item.quantity}
                      itemName={item.productName}
                      onDecrease={() => decreaseQuantity(item.variantId)}
                      onIncrease={() => increaseQuantity(item.variantId)}
                      canDecrease={item.quantity > 1}
                      canIncrease={item.quantity < item.maxQuantity}
                    />
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 ? (
                        <p className="text-xs text-muted tabular-nums">
                          {formatPrice(item.price)} за шт.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4 text-muted hover:text-danger"
            onClick={() => {
              if (window.confirm("Видалити всі товари з кошика?")) clearCart();
            }}
          >
            <Trash2 size={14} aria-hidden="true" /> Очистити кошик
          </Button>
        </div>

        <aside className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-lg font-medium">Підсумок</h2>
          <div className="mt-5 grid gap-3 border-b border-border pb-4 text-sm">
            <div className="flex justify-between gap-4 text-muted">
              <span>Товари ({totalQuantity})</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <span>Доставка</span>
              <span className="text-right text-foreground">
                За тарифом перевізника
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
            className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}
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

      <div
        data-sticky-bar="visible"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-page pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-bar)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Разом за товари</p>
            <p className="text-base font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </p>
          </div>
          <Link
            href="/checkout"
            className={buttonClasses({ className: "shrink-0" })}
          >
            Оформити <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
