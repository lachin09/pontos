import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRODUCT_SORTS } from "@/lib/constants/product";
import { colorName } from "@/lib/i18n/colors";
import type { Locale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";

interface CatalogFilterFormProps {
  idPrefix: string;
  locale: Locale;
  categories: { name: string; slug: string }[];
  gender?: string;
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
  locale,
  categories,
  gender,
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
  const { t, href } = i18nFor(locale);
  const f = t.catalog.filter;

  return (
    <form action={href("/catalog")} method="get" className="grid gap-5">
      {gender ? <input type="hidden" name="gender" value={gender} /> : null}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.2em]">
          {f.title}
        </h2>
        {selectedFiltersCount > 0 ? (
          <Link
            href={href(gender ? `/catalog?gender=${gender}` : "/catalog")}
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            {f.reset}
          </Link>
        ) : null}
      </div>

      <Select
        id={id("category")}
        name="category"
        label={f.category}
        placeholder={f.allCategories}
        defaultValue={category ?? ""}
        options={categories.map((item) => ({
          label: item.name,
          value: item.slug,
        }))}
      />
      <Select
        id={id("size")}
        name="size"
        label={f.size}
        placeholder={f.allSizes}
        defaultValue={size ?? ""}
        options={sizes.map((value) => ({ label: value, value }))}
      />
      <Select
        id={id("color")}
        name="color"
        label={f.color}
        placeholder={f.allColors}
        defaultValue={color ?? ""}
        options={colors.map((value) => ({
          label: colorName(value, locale),
          value,
        }))}
      />
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{f.price}</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id={id("min-price")}
            name="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={f.min}
            label={<span className="sr-only">{f.minLabel}</span>}
            aria-label={f.minLabel}
            defaultValue={minPrice}
          />
          <Input
            id={id("max-price")}
            name="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={f.max}
            label={<span className="sr-only">{f.maxLabel}</span>}
            aria-label={f.maxLabel}
            defaultValue={maxPrice}
          />
        </div>
      </fieldset>
      <Checkbox
        id={id("availability")}
        name="availability"
        value="available"
        label={t.catalog.inStock}
        defaultChecked={availableOnly}
      />
      <div className="border-t border-border pt-4">
        <Select
          id={id("sort")}
          name="sort"
          label={f.sort}
          options={PRODUCT_SORTS.map((value) => ({
            value,
            label: f.sorts[value],
          }))}
          defaultValue={sort}
        />
      </div>
      <Button type="submit" className="w-full">
        {f.submit} <ArrowRight size={15} aria-hidden="true" />
      </Button>
    </form>
  );
}
