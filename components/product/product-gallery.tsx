"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/product";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-[var(--radius-card)] bg-surface-muted text-sm text-muted">
        Фото товару незабаром з’явиться
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[76px_1fr] sm:gap-4">
      <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            aria-label={`Показати фото ${index + 1} товару ${productName}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
            className={`relative size-[68px] shrink-0 overflow-hidden rounded-[var(--radius-control)] border bg-surface-muted sm:size-[76px] ${index === activeIndex ? "border-accent ring-1 ring-accent" : "border-border opacity-75 hover:opacity-100"}`}
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
      <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted sm:order-2">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 48vw"
          className="object-cover"
        />
        <p className="sr-only" aria-live="polite">
          Фото {activeIndex + 1} з {images.length}
        </p>
      </div>
    </div>
  );
}
