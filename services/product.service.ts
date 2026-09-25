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
    if (filters.availableOnly && !product.isAvailable) return false;
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
      return filtered.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          a.name.localeCompare(b.name, "uk"),
      );
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
