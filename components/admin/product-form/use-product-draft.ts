"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils/slugify";
import {
  initialDraft,
  newColor,
} from "@/components/admin/product-form/product-draft";
import type {
  ProductCategoryOption,
  ProductColorDraft,
  ProductDraft,
} from "@/components/admin/product-form/types";

export type UpdateProductField = <K extends keyof ProductDraft>(
  key: K,
  value: ProductDraft[K],
) => void;

/**
 * Editable product state: plain fields, the name → slug link (until the slug
 * is edited by hand), the base price → empty size prices link, and the
 * colours with their sizes.
 */
export function useProductDraft(
  categories: ProductCategoryOption[],
  initialProduct?: ProductDraft,
) {
  const [draft, setDraft] = useState<ProductDraft>(
    () => initialProduct ?? initialDraft(categories),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct));

  const update: UpdateProductField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const setName = (name: string) => {
    setDraft((current) => ({
      ...current,
      name,
      ...(!slugTouched ? { slug: slugify(name) } : {}),
    }));
  };

  const setPrice = (price: string) => {
    setDraft((current) => ({
      ...current,
      price,
      colors: current.colors.map((color) => ({
        ...color,
        sizes: color.sizes.map((size) =>
          size.price === "" ? { ...size, price } : size,
        ),
      })),
    }));
  };

  const updateColor = (index: number, patch: Partial<ProductColorDraft>) => {
    setDraft((current) => ({
      ...current,
      colors: current.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, ...patch } : color,
      ),
    }));
  };

  const addColor = () => update("colors", [...draft.colors, newColor()]);

  const removeColor = (index: number) =>
    update(
      "colors",
      draft.colors.filter((_, row) => row !== index),
    );

  return {
    draft,
    update,
    setName,
    setPrice,
    markSlugTouched: () => setSlugTouched(true),
    updateColor,
    addColor,
    removeColor,
  };
}
