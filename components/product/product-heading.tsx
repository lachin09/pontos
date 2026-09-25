import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";

export function ProductHeading({
  name,
  price,
  oldPrice,
  discount,
  isNew,
  isSale,
}: {
  name: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  isNew: boolean;
  isSale: boolean;
}) {
  const showOldPrice = oldPrice !== null && oldPrice > 0 && discount > 0;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {isNew ? <Badge variant="accent">Новинка</Badge> : null}
        {isSale && discount > 0 ? (
          <Badge variant="sale">Знижка −{discount}%</Badge>
        ) : null}
      </div>
      <h1 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.6rem]">
        {name}
      </h1>
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span
          className={`text-2xl font-semibold tracking-tight tabular-nums ${discount > 0 ? "text-highlight" : ""}`}
        >
          {formatPrice(price)}
        </span>
        {showOldPrice ? (
          <>
            <span className="text-sm text-muted tabular-nums line-through">
              <span className="sr-only">Стара ціна: </span>
              {formatPrice(oldPrice)}
            </span>
            <span className="text-xs font-medium text-accent">
              Економія {formatPrice(oldPrice - price)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
