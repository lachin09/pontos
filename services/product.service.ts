import type { ProductRepository } from "@/repositories/product.repository";
import type { ProductSort } from "@/lib/constants/product";
import type { Product } from "@/types/product";

export interface ProductFilters {
  categoryId?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  sort?: ProductSort;
}

/** The same model in another colour: same category, names one word apart. */
function isSameModel(a: Product, b: Product) {
  if (a.categoryId !== b.categoryId) return false;
  const wordsA = a.name.split(/\s+/);
  const wordsB = b.name.split(/\s+/);
  return (
    wordsA.length > 1 &&
    wordsA.length === wordsB.length &&
    wordsA.filter((word, index) => word !== wordsB[index]).length === 1
  );
}

/**
 * Recommended order: the colours of one model stay side by side, a featured
 * product brings its whole model to the front, and the rest go by name.
 */
function sortFeatured(products: Product[]): Product[] {
  const models: Product[][] = [];
  const byName = products.toSorted((a, b) =>
    a.name.localeCompare(b.name, "uk"),
  );
  for (const product of byName) {
    const model = models.find((group) => isSameModel(group[0], product));
    if (model) model.push(product);
    else models.push([product]);
  }
  const featuredFirst = (a: Product, b: Product) =>
    Number(b.isFeatured) - Number(a.isFeatured);
  return models
    .map((group) => group.sort(featuredFirst))
    .sort((a, b) => featuredFirst(a[0], b[0]))
    .flat();
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  const filtered = products.filter((product) => {
    if (filters.categoryId && product.categoryId !== filters.categoryId)
      return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice)
      return false;
    // In stock means some size can actually be bought, not just that the
    // product is switched on.
    if (
      filters.availableOnly &&
      !(
        product.isAvailable &&
        product.variants.some((variant) => variant.isAvailable)
      )
    )
      return false;
    if (filters.size || filters.color) {
      const hasMatchingVariant = product.variants.some(
        (variant) =>
          (!filters.size ||
            variant.size.toLowerCase() === filters.size.toLowerCase()) &&
          (!filters.color ||
            variant.color.toLowerCase() === filters.color.toLowerCase()) &&
          (!filters.availableOnly || variant.isAvailable),
      );
      if (!hasMatchingVariant) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      return filtered.sort((a, b) => a.price - b.price);
    case "price-desc":
      return filtered.sort((a, b) => b.price - a.price);
    case "newest":
      return filtered.sort(
        (a, b) =>
          Number(b.isNew) - Number(a.isNew) ||
          b.createdAt.localeCompare(a.createdAt),
      );
    case "featured":
    default:
      return sortFeatured(filtered);
  }
}

export function createProductService(repository: ProductRepository) {
  return {
    listProducts: () => repository.list(),
    getProductBySlug: (slug: string) => repository.getBySlug(slug),
    listRelatedProducts: (categoryId: string, excludeId: string, limit = 4) =>
      repository.listRelated(categoryId, excludeId, limit),
    filterProducts: async (filters: ProductFilters) =>
      filterAndSortProducts(await repository.list(), filters),
  };
}
