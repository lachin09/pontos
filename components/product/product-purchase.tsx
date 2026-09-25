"use client";

import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useProductColor } from "@/components/product/product-color-context";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart.store";
import type { Product, ProductVariant } from "@/types/product";

function uniqueColors(variants: ProductVariant[]) {
  return Array.from(
    new Map(variants.map((variant) => [variant.color, variant])).values(),
  );
}

export function ProductPurchase({ product }: { product: Product }) {
  const initialVariant =
    product.variants.find((variant) => variant.isAvailable) ??
    product.variants[0];
  const { selectedColor, setSelectedColor } = useProductColor();
  const [selectedSize, setSelectedSize] = useState(initialVariant?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const closeToast = useCallback(() => setToastOpen(false), []);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.color.trim().toLowerCase() === selectedColor.trim().toLowerCase() &&
          variant.size === selectedSize,
      ),
    [product.variants, selectedColor, selectedSize],
  );
  const colors = uniqueColors(product.variants);
  const sizes = Array.from(
    new Set(product.variants.map((variant) => variant.size)),
  );
  const canAddToCart = Boolean(
    selectedVariant?.isAvailable &&
    selectedVariant.stock > 0 &&
    quantity <= selectedVariant.stock,
  );
  const currentPrice = selectedVariant?.price ?? product.price;
  const discount = product.oldPrice
    ? Math.max(0, Math.round((1 - currentPrice / product.oldPrice) * 100))
    : 0;

  function chooseColor(color: string) {
    setSelectedColor(color);
    const hasCurrentSize = product.variants.some(
      (v) =>
        v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
        v.size === selectedSize &&
        v.isAvailable &&
        v.stock > 0,
    );
    if (!hasCurrentSize) {
      const firstAvailable =
        product.variants.find(
          (v) =>
            v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
            v.isAvailable &&
            v.stock > 0,
        ) ??
        product.variants.find(
          (v) => v.color.trim().toLowerCase() === color.trim().toLowerCase(),
        );
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size);
      }
    }
    setQuantity(1);
  }

  function chooseSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
  }

  function addToCart() {
    if (!selectedVariant || !canAddToCart) return;
    const normalizedColor = selectedColor.trim().toLowerCase();
    addItem(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: selectedVariant.id,
        productName: product.name,
        productImage:
          product.images.find(
            (image) =>
              image.color &&
              image.color.trim().toLowerCase() === normalizedColor,
          )?.url ??
          product.images.find((image) => !image.color || !image.color.trim())?.url ??
          product.images[0]?.url ??
          null,
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
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.isNew ? <Badge variant="accent">Новинка</Badge> : null}
          {product.isSale && discount > 0 ? (
            <Badge variant="sale">Знижка −{discount}%</Badge>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          {product.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatPrice(currentPrice)}
          </span>
          {product.oldPrice ? (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
          {product.oldPrice && discount > 0 ? (
            <span className="text-xs font-medium text-accent">
              Економія {formatPrice(product.oldPrice - currentPrice)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 border-y border-border py-5">
        <fieldset>
          <legend className="mb-3 text-sm font-medium">
            Колір{" "}
            <span className="font-normal text-muted">
              — {selectedColor || "не обрано"}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((variant) => (
              <button
                key={variant.color}
                type="button"
                aria-label={variant.color}
                aria-pressed={variant.color === selectedColor}
                title={variant.color}
                onClick={() => chooseColor(variant.color)}
                className={`grid size-9 place-items-center rounded-full border p-1 ${variant.color === selectedColor ? "border-accent ring-1 ring-accent ring-offset-2" : "border-border hover:ring-1 hover:ring-muted"}`}
              >
                <span
                  aria-hidden="true"
                  className="size-full rounded-full border border-black/10"
                  style={{ backgroundColor: variant.colorHex }}
                />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-medium">
            Розмір{" "}
            <span className="font-normal text-muted">
              — {selectedSize || "не обрано"}
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = product.variants.find(
                (item) =>
                  item.color.trim().toLowerCase() ===
                    selectedColor.trim().toLowerCase() && item.size === size,
              );
              const unavailable = !variant?.isAvailable || variant.stock < 1;

              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={size === selectedSize}
                  aria-label={`${size}${unavailable ? ", немає в наявності" : ""}`}
                  onClick={() => chooseSize(size)}
                  className={`min-w-12 rounded-[var(--radius-control)] border px-3 py-2 text-sm transition-colors ${size === selectedSize ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"} ${unavailable && size !== selectedSize ? "text-muted line-through" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <p
        className={`text-sm ${canAddToCart ? "text-success" : "text-muted"}`}
        aria-live="polite"
      >
        {canAddToCart
          ? `В наявності · ${selectedVariant?.stock} шт.`
          : selectedVariant
            ? "Цей варіант наразі недоступний"
            : "Оберіть доступний варіант"}
      </p>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex h-12 items-center rounded-[var(--radius-control)] border border-border bg-surface">
          <button
            type="button"
            aria-label="Зменшити кількість"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            className="grid size-11 place-items-center text-foreground hover:text-accent disabled:opacity-40"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <output
            aria-label="Кількість"
            className="min-w-7 text-center text-sm tabular-nums"
          >
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Збільшити кількість"
            onClick={() =>
              setQuantity((current) =>
                Math.min(selectedVariant?.stock ?? 1, current + 1),
              )
            }
            disabled={
              !canAddToCart || quantity >= (selectedVariant?.stock ?? 0)
            }
            className="grid size-11 place-items-center text-foreground hover:text-accent disabled:opacity-40"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>
        <Button
          type="button"
          onClick={addToCart}
          disabled={!canAddToCart}
          className="min-w-52 flex-1"
        >
          <ShoppingBag size={17} aria-hidden="true" />
          {canAddToCart ? "Додати в кошик" : "Немає в наявності"}
        </Button>
      </div>

      <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 sm:grid-cols-2">
        <p className="flex items-center gap-2 text-xs leading-5 text-muted">
          <Truck
            size={16}
            className="shrink-0 text-accent"
            aria-hidden="true"
          />
          Нова пошта, Укрпошта або кур’єр
        </p>
        <p className="flex items-center gap-2 text-xs leading-5 text-muted">
          <WalletCards
            size={16}
            className="shrink-0 text-accent"
            aria-hidden="true"
          />
          Переказ або оплата при отриманні
        </p>
      </div>

      <Link
        href="/#delivery"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
      >
        Деталі доставки й оплати <ArrowRight size={13} aria-hidden="true" />
      </Link>

      <Toast open={toastOpen} onClose={closeToast}>
        {product.name} додано до кошика.
      </Toast>
    </div>
  );
}
