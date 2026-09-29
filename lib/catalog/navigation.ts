import {
  categoryGender,
  shortCategoryName,
  type Gender,
} from "@/lib/catalog/gender";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export interface CategoryLink {
  slug: string;
  name: string;
  /** Name without the "Чоловічі" / "Жіночі" prefix. */
  shortName: string;
  gender: Gender | undefined;
  imageUrl: string | null;
  productCount: number;
}

/** Categories that have published products, in the admin's order. */
export function categoryLinks(
  categories: Category[],
  products: Product[],
): CategoryLink[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return categories
    .filter((category) => (counts.get(category.id) ?? 0) > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      shortName: shortCategoryName(category.name),
      gender: categoryGender(category),
      imageUrl: category.imageUrl,
      productCount: counts.get(category.id) ?? 0,
    }));
}
