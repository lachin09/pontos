import type { CategoryRepository } from "@/repositories/category.repository";
import type { OrderRepository } from "@/repositories/order.repository";
import type { ProductRepository } from "@/repositories/product.repository";
import { mockCategories } from "@/mocks/categories";
import { mockOrders } from "@/mocks/orders";
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
  async listAll() {
    return mockCategories;
  },
  async getActiveBySlug(slug) {
    return (
      mockCategories.find(
        (category) => category.isActive && category.slug === slug,
      ) ?? null
    );
  },
};

export const mockOrderRepository: OrderRepository = {
  async list() {
    return mockOrders;
  },
  async getById(id) {
    return mockOrders.find((order) => order.id === id) ?? null;
  },
};
