"use client";

import { useState } from "react";
import { slugify } from "@/lib/utils/slugify";
import {
  initialDraft,
  newVariant,
} from "@/components/admin/product-form/product-draft";
import type {
  ProductCategoryOption,
  ProductDraft,
  ProductVariantDraft,
} from "@/components/admin/product-form/types";

export type UpdateProductField = <K extends keyof ProductDraft>(
  key: K,
  value: ProductDraft[K],
) => void;

/**
 * Editable product state: plain fields, the name → slug link (until the slug
 * is edited by hand), the base price → empty variant prices link, and the
 * variant rows.
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
      variants: current.variants.map((variant) =>
        variant.price === "" ? { ...variant, price } : variant,
      ),
    }));
  };

  const updateVariant = (
    index: number,
    patch: Partial<ProductVariantDraft>,
  ) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  const addVariant = () =>
    update("variants", [...draft.variants, newVariant(draft.price)]);

  const removeVariant = (index: number) =>
    update(
      "variants",
      draft.variants.filter((_, row) => row !== index),
    );

  return {
    draft,
    update,
    setName,
    setPrice,
    markSlugTouched: () => setSlugTouched(true),
    updateVariant,
    addVariant,
    removeVariant,
  };
}
