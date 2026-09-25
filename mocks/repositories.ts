import type { CategoryRepository } from "@/repositories/category.repository";
import type { ProductRepository } from "@/repositories/product.repository";
import { mockCategories } from "@/mocks/categories";
import { mockProducts } from "@/mocks/products";

export const mockProductRepository: ProductRepository = {
  async list() {
    return mockProducts;
  },
  async getBySlug(slug) {
    return mockProducts.find((product) => product.slug === slug) ?? null;
  },
  async listRelated(categoryId, excludeId, limit) {
    return mockProducts
      .filter(
        (product) =>
          product.categoryId === categoryId && product.id !== excludeId,
      )
      .slice(0, limit);
  },
};

export const mockCategoryRepository: CategoryRepository = {
  async listActive() {
    return mockCategories.filter((category) => category.isActive);
  },
  async getActiveBySlug(slug) {
    return (
      mockCategories.find(
        (category) => category.isActive && category.slug === slug,
      ) ?? null
    );
  },
};
