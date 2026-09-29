import type { Locale } from "@/lib/i18n/config";
import { localizedText, type ProductTextField } from "@/lib/i18n/content";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

/** The product with its text in `locale` (Ukrainian where untranslated). */
export function localizeProduct(product: Product, locale: Locale): Product {
  if (locale === "uk") return product;
  const text = (original: string, field: ProductTextField) =>
    localizedText(original, product.translations, field, locale);
  return {
    ...product,
    name: text(product.name, "name"),
    description: text(product.description, "description"),
    composition: text(product.composition, "composition"),
    careInstructions: text(product.careInstructions, "careInstructions"),
  };
}

export function localizeCategory(category: Category, locale: Locale): Category {
  if (locale === "uk") return category;
  return {
    ...category,
    name: localizedText(category.name, category.translations, "name", locale),
    description: localizedText(
      category.description,
      category.translations,
      "description",
      locale,
    ),
  };
}
