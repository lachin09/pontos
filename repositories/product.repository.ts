import type { AdminProductInput } from "@/lib/validators/admin-product";
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

export interface AdminProductListItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  price: number;
  isPublished: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  stock: number;
  imageCount: number;
}

export interface AdminProductDetails extends Omit<
  Product,
  "isAvailable" | "createdAt" | "updatedAt"
> {
  isPublished: boolean;
  isAvailable: boolean;
}

/** Catalogue management for the admin area, including unpublished products. */
export interface ProductAdminRepository {
  list(): Promise<AdminProductListItem[]>;
  getById(id: string): Promise<AdminProductDetails | null>;
  exists(id: string): Promise<boolean>;
  /** Creates (id = null) or updates a product with its variants; returns the id. */
  save(id: string | null, product: AdminProductInput): Promise<string>;
  delete(id: string): Promise<void>;
}

export interface ProductImageRecord {
  id: string;
  productId: string;
  storagePath: string;
  alt: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ProductImageRepository {
  listStoragePaths(productId: string): Promise<string[]>;
  nextSortOrder(productId: string): Promise<number>;
  create(
    image: Omit<ProductImageRecord, "id" | "createdAt">,
  ): Promise<ProductImageRecord>;
  update(
    productId: string,
    imageId: string,
    changes: Pick<ProductImageRecord, "alt" | "color" | "sortOrder">,
  ): Promise<void>;
  findStoragePath(productId: string, imageId: string): Promise<string | null>;
  delete(productId: string, imageId: string): Promise<void>;
  /**
   * Whether past orders still show this image URL. Returns null when the
   * check itself fails, so callers can err on the side of keeping the file.
   */
  isUsedByOrders(publicUrl: string): Promise<boolean | null>;
}
