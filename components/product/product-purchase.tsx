"use client";

import { ArrowRight, ShoppingBag, Truck, WalletCards } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ProductHeading } from "@/components/product/product-heading";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { useVariantSelection } from "@/components/product/use-variant-selection";
import { VariantOptions } from "@/components/product/variant-options";
import { Button, buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Toast } from "@/components/ui/toast";
import { useIsOffscreen } from "@/lib/hooks/use-is-offscreen";
import { useI18n } from "@/lib/i18n/client";
import { colorName } from "@/lib/i18n/colors";
import { fill } from "@/lib/i18n/dictionaries";
import { primaryImageUrl } from "@/lib/product/variants";
import { useCartStore } from "@/stores/cart.store";
import type { Product } from "@/types/product";

export function ProductPurchase({ product }: { product: Product }) {
  const { t, locale, href } = useI18n();
  const selection = useVariantSelection(product);
  const {
    selectedColor,
    selectedSize,
    selectedVariant,
    quantity,
    price,
    canAddToCart,
    isLowStock,
  } = selection;
  const addItem = useCartStore((state) => state.addItem);
  const [toastOpen, setToastOpen] = useState(false);
  const closeToast = useCallback(() => setToastOpen(false), []);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  // The phone buy bar appears whenever the main buttons are off screen.
  const actionsOffscreen = useIsOffscreen(actionsRef);

  function addToCart() {
    if (!selectedVariant || !canAddToCart) return;
    addItem(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: selectedVariant.id,
        productName: product.name,
        productImage: primaryImageUrl(product, selectedColor),
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: selectedVariant.price,
        quantity,
      },
      selectedVariant.stock,
    );
    setToastOpen(true);
  }

  return (
    <div className="grid gap-6">
      <ProductHeading
        name={product.name}
        price={price}
        oldPrice={product.oldPrice}
        discount={selection.discount}
        isNew={product.isNew}
        isSale={product.isSale}
      />

      <div
        ref={optionsRef}
        className="grid scroll-mt-24 gap-5 border-y border-border py-5"
      >
        <VariantOptions {...selection} />
      </div>

      <p
        className={`flex items-center gap-2 text-sm ${canAddToCart ? (isLowStock ? "text-highlight" : "text-success") : "text-muted"}`}
        aria-live="polite"
      >
        <span
          className={`size-2 rounded-full ${canAddToCart ? "bg-current" : "bg-border"}`}
          aria-hidden="true"
        />
        {canAddToCart
          ? isLowStock
            ? fill(t.product.lowStock, { count: selectedVariant?.stock ?? 0 })
            : t.product.inStock
          : selectedVariant
            ? t.product.variantUnavailable
            : t.product.chooseVariant}
      </p>

      <div ref={actionsRef} className="flex flex-wrap gap-3">
        <QuantityStepper
          value={quantity}
          onDecrease={selection.decreaseQuantity}
          onIncrease={selection.increaseQuantity}
          canDecrease={quantity > 1}
          canIncrease={canAddToCart && quantity < (selectedVariant?.stock ?? 0)}
        />
        <Button
          type="button"
          onClick={addToCart}
          disabled={!canAddToCart}
          className="min-w-52 flex-1"
        >
          <ShoppingBag size={17} aria-hidden="true" />
          {canAddToCart ? t.product.addToCart : t.product.outOfStock}
        </Button>
      </div>

      <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 sm:grid-cols-2">
        <p className="flex items-center gap-2 text-xs leading-5 text-muted">
          <Truck
            size={16}
            className="shrink-0 text-accent"
            aria-hidden="true"
          />
          {t.product.deliveryShort}
        </p>
        <p className="flex items-center gap-2 text-xs leading-5 text-muted">
          <WalletCards
            size={16}
            className="shrink-0 text-accent"
            aria-hidden="true"
          />
          {t.product.paymentShort}
        </p>
      </div>

      <StickyBuyBar
        visible={actionsOffscreen}
        title={`${product.name}${selection.hasChosenVariant ? ` · ${colorName(selectedColor, locale)} · ${selectedSize}` : ""}`}
        price={price}
        needsSizeChoice={selection.needsSizeChoice}
        canAddToCart={canAddToCart}
        onChooseSize={() =>
          optionsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        onAddToCart={addToCart}
      />

      <Toast open={toastOpen} onClose={closeToast}>
        <p className="font-medium">{t.product.added}</p>
        <p className="mt-0.5 text-xs text-foreground/70">
          {product.name} · {colorName(selectedColor, locale)} · {selectedSize}
          {quantity > 1 ? ` · ${quantity} ${t.common.pcs}` : ""}
        </p>
        <Link
          href={href("/cart")}
          className={buttonClasses({ size: "sm", className: "mt-3 w-full" })}
        >
          {t.product.goToCart} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </Toast>
    </div>
  );
}
