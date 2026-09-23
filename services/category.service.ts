import type { CategoryRepository } from "@/repositories/category.repository";

export function createCategoryService(repository: CategoryRepository) {
  return {
    listActiveCategories: () => repository.listActive(),
    getCategoryBySlug: (slug: string) => repository.getActiveBySlug(slug),
  };
}
