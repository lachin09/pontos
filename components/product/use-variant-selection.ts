"use client";

import { useState } from "react";
import { useProductColor } from "@/components/product/product-color-context";
import {
  defaultVariant,
  discountPercent,
  findVariant,
  isInStock,
  sizeForColor,
  uniqueColors,
  uniqueSizes,
} from "@/lib/product/variants";
import type { Product } from "@/types/product";

export const LOW_STOCK_THRESHOLD = 5;

/** The shopper's colour, size and quantity choice, and what follows from it. */
export function useVariantSelection(product: Product) {
  const { variants } = product;
  const { selectedColor, setSelectedColor } = useProductColor();
  const [selectedSize, setSelectedSize] = useState(
    defaultVariant(variants)?.size ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  // Until the shopper picks a size, quick actions must not assume one.
  const [sizeChosen, setSizeChosen] = useState(false);

  const colors = uniqueColors(variants);
  const sizes = uniqueSizes(variants);
  const selectedVariant = findVariant(variants, selectedColor, selectedSize);
  const inStock = isInStock(selectedVariant);
  const canAddToCart = inStock && quantity <= selectedVariant.stock;
  const price = selectedVariant?.price ?? product.price;

  return {
    colors,
    sizes,
    selectedColor,
    selectedSize,
    selectedVariant,
    quantity,
    price,
    discount: discountPercent(price, product.oldPrice),
    canAddToCart,
    isLowStock: inStock && selectedVariant.stock <= LOW_STOCK_THRESHOLD,
    needsSizeChoice: sizes.length > 1 && !sizeChosen,
    hasChosenVariant: sizeChosen || sizes.length <= 1,
    isSizeInStock: (size: string) =>
      isInStock(findVariant(variants, selectedColor, size)),

    chooseColor(color: string) {
      setSelectedColor(color);
      setSelectedSize(sizeForColor(variants, color, selectedSize));
      setQuantity(1);
    },
    chooseSize(size: string) {
      setSelectedSize(size);
      setSizeChosen(true);
      setQuantity(1);
    },
    decreaseQuantity: () => setQuantity((current) => Math.max(1, current - 1)),
    increaseQuantity: () =>
      setQuantity((current) =>
        Math.min(selectedVariant?.stock ?? 1, current + 1),
      ),
  };
}

export type VariantSelection = ReturnType<typeof useVariantSelection>;
