import { HoverPhoto } from "@/components/product/hover-photo";
import { ProductPhoto } from "@/components/product/product-photo";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { discountPercent, uniqueColors } from "@/lib/product/variants";
import { colorName } from "@/lib/i18n/colors";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types/product";

const MAX_SWATCHES = 5;

export function ProductCard({
  product,
  locale = DEFAULT_LOCALE,
  preload = false,
}: {
  product: Product;
  /** Pass the page language; the product text should already be localized. */
  locale?: Locale;
  /** For cards visible on first paint: fetch the photo early. */
  preload?: boolean;
}) {
  const { t, href, plural } = i18nFor(locale);
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
            preload={preload}
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none"
          />
        ) : null}
        {alternateImage ? (
          <HoverPhoto
            src={alternateImage.url}
            sizes="(max-width: 1024px) 30vw, 22vw"
          />
        ) : null}
        <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
          {isOnSale ? <Badge variant="sale">−{discount}%</Badge> : null}
          {!product.isAvailable ? (
            <Badge variant="neutral">{t.product.outOfStock}</Badge>
          ) : null}
          {product.isNew && product.isAvailable ? (
            <Badge variant="accent">{t.product.badgeNew}</Badge>
          ) : null}
        </span>
      </div>
      <div className="pt-3.5">
        <h3 className="line-clamp-2 font-serif text-[1.05rem] leading-snug text-foreground sm:text-[1.15rem]">
          <Link
            href={href(`/product/${product.slug}`)}
            className="outline-none transition-colors after:absolute after:inset-0 after:rounded-[var(--radius-card)] group-hover:text-gold"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <p className="flex items-baseline gap-2 tabular-nums">
            {isOnSale && product.oldPrice ? (
              <span className="text-xs text-muted line-through">
                <span className="sr-only">{t.product.oldPrice}</span>
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
            <span
              className={`text-sm font-semibold ${isOnSale ? "text-highlight" : "text-foreground"}`}
            >
              {formatPrice(product.price)}
            </span>
          </p>
          {colors.length > 1 ? (
            <div
              role="img"
              className="flex items-center gap-1.5"
              aria-label={`${colors.length} ${plural(colors.length, t.common.colors)}: ${colors.map((variant) => colorName(variant.color, locale)).join(", ")}`}
            >
              {colors.slice(0, MAX_SWATCHES).map((variant) => (
                <span
                  key={variant.color}
                  className="size-2.5 rounded-full border border-black/15"
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
      </div>
    </article>
  );
}
