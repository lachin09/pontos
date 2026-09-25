import { ProductPhoto } from "@/components/product/product-photo";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { discountPercent, uniqueColors } from "@/lib/product/variants";
import { formatPrice, pluralize } from "@/lib/utils/format";
import type { Product } from "@/types/product";

const MAX_SWATCHES = 5;

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const alternateImage = product.images[1];
  const colors = uniqueColors(product.variants);
  const discount = discountPercent(product.price, product.oldPrice);
  const isOnSale = discount > 0;

  return (
    // The title link stretches over the whole card, so each card is one tab
    // stop and the image is still clickable.
    <article className="group relative min-w-0 rounded-[var(--radius-card)] outline-offset-4 outline-focus has-[a:focus-visible]:outline-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted">
        {image ? (
          <ProductPhoto
            src={image.url}
            alt={image.alt}
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
          />
        ) : null}
        {alternateImage ? (
          // Hidden on phones: there is no hover there, so skip the download.
          <ProductPhoto
            src={alternateImage.url}
            alt=""
            sizes="(max-width: 1024px) 30vw, 22vw"
            className="hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none sm:block"
          />
        ) : null}
        <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
          {isOnSale ? <Badge variant="sale">−{discount}%</Badge> : null}
          {!product.isAvailable ? (
            <Badge variant="neutral">Немає в наявності</Badge>
          ) : null}
          {product.isNew && product.isAvailable ? (
            <Badge variant="accent">Новинка</Badge>
          ) : null}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-[0.95rem]">
            <Link
              href={`/product/${product.slug}`}
              className="outline-none transition-colors after:absolute after:inset-0 after:rounded-[var(--radius-card)] group-hover:text-accent"
            >
              {product.name}
            </Link>
          </h3>
          {colors.length > 0 ? (
            <div
              role="img"
              className="mt-2 flex items-center gap-1.5"
              aria-label={`${colors.length} ${pluralize(colors.length, ["колір", "кольори", "кольорів"])}: ${colors.map((variant) => variant.color).join(", ")}`}
            >
              {colors.slice(0, MAX_SWATCHES).map((variant) => (
                <span
                  key={variant.color}
                  className="size-3 rounded-full border border-black/15"
                  style={{ backgroundColor: variant.colorHex }}
                  aria-hidden="true"
                />
              ))}
              {colors.length > MAX_SWATCHES ? (
                <span className="text-[0.68rem] text-muted" aria-hidden="true">
                  +{colors.length - MAX_SWATCHES}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-semibold tabular-nums ${isOnSale ? "text-highlight" : "text-foreground"}`}
          >
            {formatPrice(product.price)}
          </p>
          {isOnSale && product.oldPrice ? (
            <p className="text-xs text-muted tabular-nums line-through">
              <span className="sr-only">Стара ціна: </span>
              {formatPrice(product.oldPrice)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
