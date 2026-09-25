import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format";

/** Phone-only bar that keeps the buy action in reach while scrolling. */
export function StickyBuyBar({
  visible,
  title,
  price,
  needsSizeChoice,
  canAddToCart,
  onChooseSize,
  onAddToCart,
}: {
  visible: boolean;
  title: string;
  price: number;
  needsSizeChoice: boolean;
  canAddToCart: boolean;
  onChooseSize: () => void;
  onAddToCart: () => void;
}) {
  return (
    <div
      data-sticky-bar={visible ? "visible" : "hidden"}
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-page pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[var(--shadow-bar)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden ${visible ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{title}</p>
          <p className="text-base font-semibold tabular-nums">
            {formatPrice(price)}
          </p>
        </div>
        {needsSizeChoice ? (
          <Button type="button" className="shrink-0" onClick={onChooseSize}>
            Обрати розмір
          </Button>
        ) : (
          <Button
            type="button"
            className="shrink-0"
            onClick={onAddToCart}
            disabled={!canAddToCart}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            {canAddToCart ? "У кошик" : "Немає"}
          </Button>
        )}
      </div>
    </div>
  );
}
