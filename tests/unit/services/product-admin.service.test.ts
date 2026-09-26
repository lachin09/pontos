import { describe, expect, it } from "vitest";
import { AppError, badRequest, conflict } from "@/lib/errors";
import type {
  ProductAdminRepository,
  ProductImageRecord,
  ProductImageRepository,
} from "@/repositories/product.repository";
import { createProductAdminService } from "@/services/admin/product-admin.service";
import { fakeImage, fakeStorage } from "../../support/fakes";

function setup() {
  const storage = fakeStorage();
  const productIds = new Set(["p1"]);
  const records: ProductImageRecord[] = [];
  const orderSnapshots = new Set<string>();
  let failRecordCreate = false;
  let orderCheckFails = false;
  let deleteError: AppError | null = null;

  const products: ProductAdminRepository = {
    list: async () => [],
    getById: async () => null,
    exists: async (id) => productIds.has(id),
    save: async (id) => id ?? "new-id",
    async delete(id) {
      if (deleteError) throw deleteError;
      productIds.delete(id);
    },
  };

  const images: ProductImageRepository = {
    listStoragePaths: async (productId) =>
      records
        .filter((r) => r.productId === productId)
        .map((r) => r.storagePath),
    nextSortOrder: async (productId) =>
      records.filter((r) => r.productId === productId).length,
    async create(image) {
      if (failRecordCreate) throw badRequest("Не вдалося зберегти зображення.");
      const record = {
        ...image,
        id: `img-${records.length + 1}`,
        createdAt: "now",
      };
      records.push(record);
      return record;
    },
    update: async () => {},
    findStoragePath: async (productId, imageId) =>
      records.find((r) => r.productId === productId && r.id === imageId)
        ?.storagePath ?? null,
    async delete(productId, imageId) {
      const index = records.findIndex(
        (r) => r.productId === productId && r.id === imageId,
      );
      records.splice(index, 1);
    },
    isUsedByOrders: async (url) =>
      orderCheckFails ? null : orderSnapshots.has(url),
  };

  const service = createProductAdminService({ products, images, storage });
  return {
    service,
    storage,
    records,
    orderSnapshots,
    failRecordCreate: () => (failRecordCreate = true),
    failOrderCheck: () => (orderCheckFails = true),
    failDelete: (error: AppError) => (deleteError = error),
  };
}

describe("product admin service", () => {
  describe("addImage", () => {
    it("uploads the file, records it with the next sort order and returns its URL", async () => {
      const { service, storage, records } = setup();
      await service.addImage("p1", fakeImage, { alt: "Спереду", color: null });
      const second = await service.addImage("p1", fakeImage, {
        alt: "Ззаду",
        color: "Чорний",
      });

      expect(records.map((r) => r.sortOrder)).toEqual([0, 1]);
      expect(second).toMatchObject({
        alt: "Ззаду",
        color: "Чорний",
        url: `https://cdn.test/${second.storagePath}`,
      });
      expect(storage.files.size).toBe(2);
    });

    it("refuses unknown products without uploading", async () => {
      const { service, storage } = setup();
      await expect(
        service.addImage("missing", fakeImage, { alt: "", color: null }),
      ).rejects.toMatchObject({
        status: 404,
        message: "Товар не знайдено.",
      });
      expect(storage.files.size).toBe(0);
    });

    it("reports a failed upload as a 400", async () => {
      const { service, storage } = setup();
      storage.failUpload = true;
      await expect(
        service.addImage("p1", fakeImage, { alt: "", color: null }),
      ).rejects.toMatchObject({
        status: 400,
        message: "Не вдалося завантажити зображення.",
      });
    });

    it("deletes the uploaded file when the record cannot be saved", async () => {
      const { service, storage, failRecordCreate } = setup();
      failRecordCreate();
      await expect(
        service.addImage("p1", fakeImage, { alt: "", color: null }),
      ).rejects.toMatchObject({
        message: "Не вдалося зберегти зображення.",
      });
      expect(storage.files.size).toBe(0);
      expect(storage.removed).toHaveLength(1);
    });
  });

  describe("removeImage", () => {
    it("deletes the record and the file when no order shows it", async () => {
      const { service, storage, records } = setup();
      const image = await service.addImage("p1", fakeImage, {
        alt: "",
        color: null,
      });
      await service.removeImage("p1", image.id);
      expect(records).toHaveLength(0);
      expect(storage.files.size).toBe(0);
    });

    it("keeps the file while past orders still show it", async () => {
      const { service, storage, orderSnapshots } = setup();
      const image = await service.addImage("p1", fakeImage, {
        alt: "",
        color: null,
      });
      orderSnapshots.add(image.url);
      await service.removeImage("p1", image.id);
      expect(storage.files.has(image.storagePath)).toBe(true);
    });

    it("keeps the file when the order check itself fails", async () => {
      const { service, storage, failOrderCheck } = setup();
      const image = await service.addImage("p1", fakeImage, {
        alt: "",
        color: null,
      });
      failOrderCheck();
      await service.removeImage("p1", image.id);
      expect(storage.files.has(image.storagePath)).toBe(true);
    });

    it("returns 404 for an unknown image", async () => {
      const { service } = setup();
      await expect(service.removeImage("p1", "nope")).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe("remove", () => {
    it("deletes the product and then all of its photo files", async () => {
      const { service, storage } = setup();
      await service.addImage("p1", fakeImage, { alt: "", color: null });
      await service.addImage("p1", fakeImage, { alt: "", color: null });
      await service.remove("p1");
      expect(storage.files.size).toBe(0);
    });

    it("keeps the photos when the product cannot be deleted", async () => {
      const { service, storage, failDelete } = setup();
      await service.addImage("p1", fakeImage, { alt: "", color: null });
      failDelete(conflict("Цей товар є в історії замовлень."));
      await expect(service.remove("p1")).rejects.toMatchObject({ status: 409 });
      expect(storage.files.size).toBe(1);
    });
  });

  it("creates with no id and updates with one", async () => {
    const { service } = setup();
    const product = {} as Parameters<typeof service.create>[0];
    await expect(service.create(product)).resolves.toBe("new-id");
    await expect(service.update("p1", product)).resolves.toBe("p1");
  });
});
