import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const alternateImage = product.images[1];
  const colors = Array.from(
    new Map(
      product.variants.map((variant) => [variant.color, variant]),
    ).values(),
  );
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="group min-w-0">
      <Link
        href={`/product/${product.slug}`}
        aria-label={`Переглянути товар: ${product.name}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
            className="relative z-0 object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
          />
        ) : null}
        {alternateImage ? (
          <Image
            src={alternateImage.url}
            alt={alternateImage.alt}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
            className="z-10 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
          />
        ) : null}
        <span className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          {product.isSale ? <Badge variant="sale">-{discount}%</Badge> : null}
          {!product.isAvailable ? (
            <Badge variant="neutral">Немає в наявності</Badge>
          ) : null}
          {product.isNew && product.isAvailable ? (
            <Badge variant="accent">Новинка</Badge>
          ) : null}
        </span>
        <span className="absolute inset-x-2 bottom-2 z-20 flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-surface/95 px-2 py-2.5 text-[0.65rem] font-semibold text-foreground shadow-sm transition duration-200 sm:inset-x-3 sm:bottom-3 sm:translate-y-2 sm:px-3 sm:py-3 sm:text-xs sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
          Переглянути <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </Link>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground sm:text-base">
            <Link
              href={`/product/${product.slug}`}
              className="hover:text-accent"
            >
              {product.name}
            </Link>
          </h3>
          <div
            role="img"
            className="mt-2 flex items-center gap-1.5"
            aria-label={`Кольори: ${colors.map((variant) => variant.color).join(", ")}`}
          >
            {colors.slice(0, 5).map((variant) => (
              <span
                key={variant.color}
                className="size-3 rounded-full border border-black/15"
                style={{ backgroundColor: variant.colorHex }}
                aria-hidden="true"
              />
            ))}
            {colors.length > 5 ? (
              <span className="ml-1 text-[0.65rem] text-muted">
                +{colors.length - 5}
              </span>
            ) : null}
            <span className="ml-1 text-[0.68rem] text-muted">
              {colors.length} {colors.length === 1 ? "колір" : "кольори"}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {formatPrice(product.price)}
          </p>
          {product.oldPrice ? (
            <p className="text-xs text-muted line-through">
              {formatPrice(product.oldPrice)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
