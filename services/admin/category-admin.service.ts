import { badRequest, conflict, notFound } from "@/lib/errors";
import type { ValidImageFile } from "@/lib/storage/image-file";
import { isStoragePath, type ImageStorage } from "@/lib/storage/image-storage";
import type { AdminCategoryInput } from "@/lib/validators/admin-category";
import type { CategoryAdminRepository } from "@/repositories/category.repository";

export type CategoryAdminService = ReturnType<
  typeof createCategoryAdminService
>;

const categoryNotFound = () => notFound("Категорію не знайдено.");

export function createCategoryAdminService(deps: {
  categories: CategoryAdminRepository;
  storage: ImageStorage;
}) {
  const { categories, storage } = deps;

  /** Seed categories point at external URLs; only our own files are deleted. */
  const removeStoredImage = async (image: string | null) => {
    if (isStoragePath(image)) await storage.remove([image]);
  };

  return {
    listAll: () => categories.listAll(),
    listOptions: (options?: { activeOnly?: boolean }) =>
      categories.listOptions(options),
    create: (category: AdminCategoryInput) => categories.create(category),
    update: (id: string, category: AdminCategoryInput) =>
      categories.update(id, category),

    async remove(id: string) {
      const image = await categories.findImage(id);
      if (image === undefined) throw categoryNotFound();
      await categories.delete(id);
      await removeStoredImage(image);
    },

    /** Saves a new order; `ids` must list every category exactly once. */
    async reorder(ids: string[]) {
      if (new Set(ids).size !== ids.length) {
        throw badRequest("Перевірте порядок категорій.");
      }
      let existing: string[];
      try {
        existing = await categories.listIds();
      } catch {
        existing = [];
      }
      if (
        existing.length !== ids.length ||
        existing.some((id) => !ids.includes(id))
      ) {
        throw conflict("Список категорій змінився. Оновіть сторінку.");
      }
      for (const [sortOrder, id] of ids.entries()) {
        await categories.setSortOrder(id, sortOrder);
      }
    },

    /** Replaces the category photo and returns its public URL. */
    async setImage(id: string, image: ValidImageFile) {
      const previous = await categories.findImage(id);
      if (previous === undefined) throw categoryNotFound();

      let path: string;
      try {
        path = await storage.upload(`categories/${id}`, image);
      } catch {
        throw badRequest("Не вдалося завантажити зображення.");
      }
      try {
        await categories.setImage(id, path);
      } catch {
        await storage.remove([path]);
        throw badRequest("Не вдалося зберегти зображення.");
      }
      await removeStoredImage(previous);
      return storage.publicUrl(path);
    },

    async removeImage(id: string) {
      const previous = await categories.findImage(id);
      if (previous === undefined) throw categoryNotFound();
      try {
        await categories.setImage(id, null);
      } catch {
        throw badRequest("Не вдалося видалити зображення.");
      }
      await removeStoredImage(previous);
    },
  };
}
