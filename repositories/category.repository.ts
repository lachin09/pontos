import type { Category } from "@/types/category";

export interface CategoryRepository {
  listActive(): Promise<Category[]>;
  getActiveBySlug(slug: string): Promise<Category | null>;
  listAll(): Promise<Category[]>;
}
