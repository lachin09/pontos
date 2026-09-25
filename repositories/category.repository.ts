import type { AdminCategoryInput } from "@/lib/validators/admin-category";
import type { Category } from "@/types/category";

export interface CategoryRepository {
  listActive(): Promise<Category[]>;
  getActiveBySlug(slug: string): Promise<Category | null>;
}

export interface CategoryOption {
  id: string;
  name: string;
}

/** Category management for the admin area. */
export interface CategoryAdminRepository {
  listAll(): Promise<Category[]>;
  listOptions(options?: { activeOnly?: boolean }): Promise<CategoryOption[]>;
  create(category: AdminCategoryInput): Promise<string>;
  update(id: string, category: AdminCategoryInput): Promise<string>;
  delete(id: string): Promise<void>;
  /** The stored image value (URL or storage path), or undefined if no such category. */
  findImage(id: string): Promise<string | null | undefined>;
  setImage(id: string, image: string | null): Promise<void>;
  listIds(): Promise<string[]>;
  setSortOrder(id: string, sortOrder: number): Promise<void>;
}
