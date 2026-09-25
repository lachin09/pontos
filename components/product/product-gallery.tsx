"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useProductColor } from "@/components/product/product-color-context";
import { ProductPhoto } from "@/components/product/product-photo";
import { imagesForColor } from "@/lib/product/variants";
import type { ProductImage } from "@/types/product";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const { selectedColor } = useProductColor();
  const [selectedColorState, setSelectedColorState] = useState(selectedColor);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (selectedColorState !== selectedColor) {
    setSelectedColorState(selectedColor);
    setActiveIndex(0);
  }

  const colorImages = useMemo(
    () => imagesForColor(images, selectedColor),
    [images, selectedColor],
  );

  const activeImage = colorImages[activeIndex] ?? colorImages[0];

  if (colorImages.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center bg-surface-muted text-sm text-muted sm:rounded-[var(--radius-card)]">
        Фото товару незабаром з’явиться
      </div>
    );
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  return (
    <>
      {/* Phones: swipeable full-bleed carousel. Keyed by colour so a colour
          change starts again from the first photo. */}
      <div className="relative sm:hidden">
        <div
          key={selectedColor}
          ref={scrollerRef}
          onScroll={handleScroll}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          aria-label={`Фото товару ${productName}`}
          role="region"
          tabIndex={0}
        >
          {colorImages.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface-muted"
            >
              <ProductPhoto
                src={image.url}
                alt={image.alt || `${productName}, фото ${index + 1}`}
                fetchPriority={index === 0 ? "high" : "auto"}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
        {colorImages.length > 1 ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5"
              aria-hidden="true"
            >
              {colorImages.map((image, index) => (
                <span
                  key={image.id}
                  className={`h-1.5 rounded-full bg-white shadow-sm transition-all duration-300 ${index === activeIndex ? "w-5" : "w-1.5 opacity-60"}`}
                />
              ))}
            </div>
            <p className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[0.7rem] font-medium text-white tabular-nums backdrop-blur-sm">
              {activeIndex + 1} / {colorImages.length}
            </p>
          </>
        ) : null}
      </div>

      {/* Tablets and up: thumbnails beside the main photo. */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-[76px_1fr]">
        <div className="flex flex-col gap-2">
          {colorImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Показати фото ${index + 1} товару ${productName}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`relative size-[76px] shrink-0 overflow-hidden rounded-[var(--radius-control)] border bg-surface-muted transition-[opacity,box-shadow] ${index === activeIndex ? "border-accent ring-1 ring-accent" : "border-border opacity-70 hover:opacity-100"}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="76px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted">
          <ProductPhoto
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.alt || productName}
            fetchPriority="high"
            sizes="(max-width: 1024px) 80vw, 48vw"
            className="animate-fade-in"
          />
          <p className="sr-only" aria-live="polite">
            Фото {activeIndex + 1} з {colorImages.length}
          </p>
        </div>
      </div>
    </>
  );
}
