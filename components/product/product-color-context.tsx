"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/types/product";

type ProductColorContextValue = {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
};

const defaultContextValue: ProductColorContextValue = {
  selectedColor: "",
  setSelectedColor: () => {},
};

const ProductColorContext = createContext<ProductColorContextValue | null>(null);

export function ProductColorProvider({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const initialColor =
    product.variants.find((variant) => variant.isAvailable)?.color ??
    product.variants[0]?.color ??
    "";
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [prevProductId, setPrevProductId] = useState(product.id);

  if (prevProductId !== product.id) {
    setPrevProductId(product.id);
    setSelectedColor(initialColor);
  }

  return (
    <ProductColorContext.Provider value={{ selectedColor, setSelectedColor }}>
      {children}
    </ProductColorContext.Provider>
  );
}

export function useProductColor() {
  const context = useContext(ProductColorContext);
  return context ?? defaultContextValue;
}
