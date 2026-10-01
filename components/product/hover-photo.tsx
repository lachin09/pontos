"use client";

import { useEffect, useRef, useState } from "react";
import { ProductPhoto } from "@/components/product/product-photo";

/**
 * The second photo a card shows on hover. It is not fetched until the
 * pointer first reaches the card, so a catalog page loads one photo per
 * card instead of two. Phones have no hover, so they never load it.
 */
export function HoverPhoto({ src, sizes }: { src: string; sizes: string }) {
  const [wanted, setWanted] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // The card's stretched title link sits above this layer, so listen on
    // the card itself.
    const card = ref.current?.closest("article");
    if (!card) return;
    const want = () => setWanted(true);
    card.addEventListener("pointerenter", want, { once: true });
    return () => card.removeEventListener("pointerenter", want);
  }, []);

  return (
    <span
      ref={ref}
      className="absolute inset-0 hidden sm:block"
      aria-hidden="true"
    >
      {wanted ? (
        <ProductPhoto
          src={src}
          alt=""
          sizes={sizes}
          className="animate-fade-in opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        />
      ) : null}
    </span>
  );
}
