import { AppError, badRequest, notFound } from "@/lib/errors";
import type { ValidImageFile } from "@/lib/storage/image-file";
import type { ImageStorage } from "@/lib/storage/image-storage";
import type { AdminProductInput } from "@/lib/validators/admin-product";
import type {
  ProductAdminRepository,
  ProductImageRepository,
} from "@/repositories/product.repository";

export type ProductAdminService = ReturnType<typeof createProductAdminService>;

export function createProductAdminService(deps: {
  products: ProductAdminRepository;
  images: ProductImageRepository;
  storage: ImageStorage;
}) {
  const { products, images, storage } = deps;

  return {
    list: () => products.list(),
    getById: (id: string) => products.getById(id),
    create: (product: AdminProductInput) => products.save(null, product),
    update: (id: string, product: AdminProductInput) =>
      products.save(id, product),

    /** Deletes the product, then its photo files. */
    async remove(id: string) {
      let paths: string[];
      try {
        paths = await images.listStoragePaths(id);
      } catch {
        throw new AppError("Не вдалося підготувати видалення товару.", 500);
      }
      await products.delete(id);
      await storage.remove(paths);
    },

    /** Uploads a photo and records it; the upload is rolled back if recording fails. */
    async addImage(
      productId: string,
      image: ValidImageFile,
      details: { alt: string; color: string | null },
    ) {
      if (!(await products.exists(productId))) {
        throw notFound("Товар не знайдено.");
      }
      let sortOrder: number;
      try {
        sortOrder = await images.nextSortOrder(productId);
      } catch {
        throw new AppError("Не вдалося підготувати зображення.", 500);
      }

      let storagePath: string;
      try {
        storagePath = await storage.upload(productId, image);
      } catch {
        throw badRequest("Не вдалося завантажити зображення.");
      }

      try {
        const record = await images.create({
          productId,
          storagePath,
          alt: details.alt,
          color: details.color,
          sortOrder,
        });
        return { ...record, url: storage.publicUrl(record.storagePath) };
      } catch (error) {
        await storage.remove([storagePath]);
        throw error;
      }
    },

    updateImage: (
      productId: string,
      imageId: string,
      changes: { alt: string; color: string | null; sortOrder: number },
    ) => images.update(productId, imageId, changes),

    /**
     * Removes the photo record. The file is kept while past orders still show
     * it (order items store the image URL as a snapshot).
     */
    async removeImage(productId: string, imageId: string) {
      const storagePath = await images.findStoragePath(productId, imageId);
      if (!storagePath) throw notFound("Зображення не знайдено.");
      await images.delete(productId, imageId);
      const usedByOrders = await images.isUsedByOrders(
        storage.publicUrl(storagePath),
      );
      if (usedByOrders === false) await storage.remove([storagePath]);
    },
  };
}
