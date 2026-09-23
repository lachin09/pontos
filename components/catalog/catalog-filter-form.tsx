import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const sortOptions = [
  { value: "featured", label: "Рекомендовані" },
  { value: "price-asc", label: "Спочатку дешевші" },
  { value: "price-desc", label: "Спочатку дорожчі" },
  { value: "newest", label: "Спочатку новинки" },
];

interface CatalogFilterFormProps {
  idPrefix: string;
  categories: { name: string; slug: string }[];
  sizes: string[];
  colors: string[];
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly: boolean;
  sort: string;
  selectedFiltersCount: number;
}

export function CatalogFilterForm({
  idPrefix,
  categories,
  sizes,
  colors,
  category,
  size,
  color,
  minPrice,
  maxPrice,
  availableOnly,
  sort,
  selectedFiltersCount,
}: CatalogFilterFormProps) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form action="/catalog" method="get" className="grid gap-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-semibold">Фільтри</h2>
        {selectedFiltersCount > 0 ? (
          <Link
            href="/catalog"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Скинути
          </Link>
        ) : null}
      </div>

      <Select
        id={id("category")}
        name="category"
        label="Категорія"
        placeholder="Усі категорії"
        defaultValue={category ?? ""}
        options={categories.map((item) => ({
          label: item.name,
          value: item.slug,
        }))}
      />
      <Select
        id={id("size")}
        name="size"
        label="Розмір"
        placeholder="Усі розміри"
        defaultValue={size ?? ""}
        options={sizes.map((value) => ({ label: value, value }))}
      />
      <Select
        id={id("color")}
        name="color"
        label="Колір"
        placeholder="Усі кольори"
        defaultValue={color ?? ""}
        options={colors.map((value) => ({ label: value, value }))}
      />
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Ціна, ₴</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id={id("min-price")}
            name="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Від"
            label={<span className="sr-only">Мінімальна ціна</span>}
            aria-label="Мінімальна ціна"
            defaultValue={minPrice}
          />
          <Input
            id={id("max-price")}
            name="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="До"
            label={<span className="sr-only">Максимальна ціна</span>}
            aria-label="Максимальна ціна"
            defaultValue={maxPrice}
          />
        </div>
      </fieldset>
      <Checkbox
        id={id("availability")}
        name="availability"
        value="available"
        label="Є в наявності"
        defaultChecked={availableOnly}
      />
      <div className="border-t border-border pt-4">
        <Select
          id={id("sort")}
          name="sort"
          label="Сортування"
          options={sortOptions}
          defaultValue={sort}
        />
      </div>
      <Button type="submit" className="w-full">
        Показати товари <ArrowRight size={15} aria-hidden="true" />
      </Button>
    </form>
  );
}
