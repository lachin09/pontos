import { describe, expect, it } from "vitest";
import type { CategoryAdminRepository } from "@/repositories/category.repository";
import { createCategoryAdminService } from "@/services/admin/category-admin.service";
import { fakeImage, fakeStorage } from "../../support/fakes";

function setup(images: Record<string, string | null> = { c1: null, c2: null }) {
  const storage = fakeStorage();
  const stored = new Map(Object.entries(images));
  const sortOrders = new Map<string, number>();
  let failSetImage = false;

  const categories: CategoryAdminRepository = {
    listAll: async () => [],
    listOptions: async () => [],
    create: async () => "new",
    update: async (id) => id,
    async delete(id) {
      stored.delete(id);
    },
    findImage: async (id) => (stored.has(id) ? stored.get(id)! : undefined),
    async setImage(id, image) {
      if (failSetImage) throw new Error("db down");
      stored.set(id, image);
    },
    listIds: async () => [...stored.keys()],
    async setSortOrder(id, order) {
      sortOrders.set(id, order);
    },
  };

  const service = createCategoryAdminService({ categories, storage });
  return {
    service,
    storage,
    stored,
    sortOrders,
    failSetImage: () => (failSetImage = true),
  };
}

describe("category admin service", () => {
  describe("reorder", () => {
    it("saves each category's new position", async () => {
      const { service, sortOrders } = setup();
      await service.reorder(["c2", "c1"]);
      expect(Object.fromEntries(sortOrders)).toEqual({ c2: 0, c1: 1 });
    });

    it("rejects duplicate ids", async () => {
      const { service } = setup();
      await expect(service.reorder(["c1", "c1"])).rejects.toMatchObject({
        status: 400,
      });
    });

    it("rejects a list that no longer matches the categories", async () => {
      const { service, sortOrders } = setup();
      await expect(service.reorder(["c1"])).rejects.toMatchObject({
        status: 409,
        message: "Список категорій змінився. Оновіть сторінку.",
      });
      await expect(service.reorder(["c1", "c3"])).rejects.toMatchObject({
        status: 409,
      });
      expect(sortOrders.size).toBe(0);
    });
  });

  describe("setImage", () => {
    it("stores the new photo, removes the old uploaded one and returns the URL", async () => {
      const { service, storage, stored } = setup({
        c1: "categories/c1/old.jpg",
      });
      storage.files.add("categories/c1/old.jpg");
      const url = await service.setImage("c1", fakeImage);
      expect(stored.get("c1")).toBe("categories/c1/file-1.jpg");
      expect(url).toBe("https://cdn.test/categories/c1/file-1.jpg");
      expect(storage.files.has("categories/c1/old.jpg")).toBe(false);
    });

    it("never deletes external seed image URLs", async () => {
      const { service, storage } = setup({
        c1: "https://images.unsplash.com/photo",
      });
      await service.setImage("c1", fakeImage);
      expect(storage.removed).toEqual([]);
    });

    it("removes the new upload if the category cannot be updated", async () => {
      const { service, storage, failSetImage } = setup();
      failSetImage();
      await expect(service.setImage("c1", fakeImage)).rejects.toMatchObject({
        message: "Не вдалося зберегти зображення.",
      });
      expect(storage.files.size).toBe(0);
    });

    it("returns 404 for an unknown category", async () => {
      const { service } = setup();
      await expect(
        service.setImage("missing", fakeImage),
      ).rejects.toMatchObject({
        status: 404,
        message: "Категорію не знайдено.",
      });
    });
  });

  it("remove deletes the category and its uploaded photo", async () => {
    const { service, storage, stored } = setup({ c1: "categories/c1/a.jpg" });
    storage.files.add("categories/c1/a.jpg");
    await service.remove("c1");
    expect(stored.has("c1")).toBe(false);
    expect(storage.files.size).toBe(0);
  });

  it("removeImage clears the photo", async () => {
    const { service, stored } = setup({ c1: "categories/c1/a.jpg" });
    await service.removeImage("c1");
    expect(stored.get("c1")).toBeNull();
  });
});
