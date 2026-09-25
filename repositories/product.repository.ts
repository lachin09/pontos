import type { Product } from "@/types/product";

export interface ProductRepository {
  list(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
  listRelated(
    categoryId: string,
    excludeId: string,
    limit: number,
  ): Promise<Product[]>;
}
