import type { VariantSelection } from "@/components/product/use-variant-selection";
import { useI18n } from "@/lib/i18n/client";
import { colorName } from "@/lib/i18n/colors";

type Props = Pick<
  VariantSelection,
  | "colors"
  | "sizes"
  | "selectedColor"
  | "selectedSize"
  | "chooseColor"
  | "chooseSize"
  | "isSizeInStock"
>;

export function VariantOptions({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  chooseColor,
  chooseSize,
  isSizeInStock,
}: Props) {
  const { t, locale } = useI18n();
  return (
    <>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          {t.product.color}{" "}
          <span className="font-normal text-muted">
            —{" "}
            {selectedColor
              ? colorName(selectedColor, locale)
              : t.common.notSelected}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {colors.map((variant) => (
            <button
              key={variant.color}
              type="button"
              aria-label={colorName(variant.color, locale)}
              aria-pressed={variant.color === selectedColor}
              title={colorName(variant.color, locale)}
              onClick={() => chooseColor(variant.color)}
              className={`grid size-11 place-items-center rounded-full border p-1 transition-shadow ${variant.color === selectedColor ? "border-accent ring-1 ring-accent ring-offset-2 ring-offset-background" : "border-border hover:ring-1 hover:ring-muted"}`}
            >
              <span
                aria-hidden="true"
                className="size-full rounded-full border border-black/10"
                style={{ backgroundColor: variant.colorHex }}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          {t.product.size}{" "}
          <span className="font-normal text-muted">
            — {selectedSize || t.common.notSelected}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const unavailable = !isSizeInStock(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={size === selectedSize}
                aria-label={`${size}${unavailable ? `, ${t.product.unavailable}` : ""}`}
                onClick={() => chooseSize(size)}
                className={`h-11 min-w-12 rounded-[var(--radius-control)] border px-3.5 text-sm font-medium transition-[background-color,border-color,color,transform] active:scale-95 ${size === selectedSize ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"} ${unavailable && size !== selectedSize ? "text-muted line-through decoration-muted/60" : ""}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
