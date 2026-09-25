import type { SupabaseClient } from "@supabase/supabase-js";
import { conflict, badRequest, notFound } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";
import { PG, translateDbError } from "@/lib/supabase/db-error";
import type { ImageStorage } from "@/lib/storage/image-storage";
import type {
  AdminProductDetails,
  ProductAdminRepository,
  ProductImageRecord,
  ProductImageRepository,
} from "@/repositories/product.repository";

type Tables = Database["public"]["Tables"];
type ProductWithRelations = Tables["products"]["Row"] & {
  product_images: Tables["product_images"]["Row"][];
  product_variants: Tables["product_variants"]["Row"][];
};

const detailsSelection =
  "id, category_id, name, slug, description, composition, care_instructions, price, old_price, is_published, is_available, is_featured, is_new, is_sale, product_images(id, product_id, storage_path, alt, color, sort_order, created_at), product_variants(id, product_id, sku, size, color, color_hex, price, stock, is_available, created_at, updated_at)";

function toDetails(
  row: ProductWithRelations,
  storage: ImageStorage,
): AdminProductDetails {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    composition: row.composition,
    careInstructions: row.care_instructions,
    price: row.price,
    oldPrice: row.old_price,
    isPublished: row.is_published,
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isSale: row.is_sale,
    images: row.product_images
      .toSorted((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        productId: image.product_id,
        url: storage.publicUrl(image.storage_path),
        alt: image.alt,
        color: image.color,
        sortOrder: image.sort_order,
        createdAt: image.created_at,
      })),
    // Admins edit the raw flag, so it is not combined with stock here.
    variants: row.product_variants
      .toSorted(
        (a, b) =>
          a.size.localeCompare(b.size) || a.color.localeCompare(b.color),
      )
      .map((variant) => ({
        id: variant.id,
        productId: variant.product_id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorHex: variant.color_hex,
        price: variant.price,
        stock: variant.stock,
        isAvailable: variant.is_available,
        createdAt: variant.created_at,
        updatedAt: variant.updated_at,
      })),
  };
}

export function createSupabaseProductAdminRepository(
  client: SupabaseClient<Database>,
  storage: ImageStorage,
): ProductAdminRepository {
  return {
    async list() {
      const { data, error } = await client
        .from("products")
        .select(
          "id, category_id, name, slug, price, is_published, is_available, is_featured, is_new, is_sale, updated_at, product_variants(stock, is_available), product_images(id)",
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data.map((product) => ({
        id: product.id,
        categoryId: product.category_id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        isPublished: product.is_published,
        isAvailable: product.is_available,
        isFeatured: product.is_featured,
        isNew: product.is_new,
        isSale: product.is_sale,
        stock: product.product_variants.reduce(
          (sum, variant) => sum + variant.stock,
          0,
        ),
        imageCount: product.product_images.length,
      }));
    },

    async getById(id) {
      const { data, error } = await client
        .from("products")
        .select(detailsSelection)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toDetails(data as ProductWithRelations, storage) : null;
    },

    async exists(id) {
      const { data, error } = await client
        .from("products")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      return !error && Boolean(data);
    },

    async save(id, { variants, ...product }) {
      const { data, error } = await client.rpc("save_product_with_variants", {
        p_product_id: id ?? "",
        p_product: product,
        p_variants: variants,
      });
      const fallback = badRequest(
        id ? "Не вдалося зберегти зміни." : "Не вдалося зберегти товар.",
      );
      if (error) {
        throw translateDbError(
          error,
          {
            [PG.uniqueViolation]: conflict(
              "Артикул або посилання такого товару вже існує.",
            ),
            [PG.noDataFound]: notFound("Товар не знайдено."),
            [PG.foreignKeyViolation]: badRequest(
              "Обрана категорія недоступна.",
            ),
          },
          fallback,
          id ? "Admin product update failed" : "Admin product create failed",
        );
      }
      if (!data) throw fallback;
      return data;
    },

    async delete(id) {
      const { error } = await client.from("products").delete().eq("id", id);
      if (error) {
        throw translateDbError(
          error,
          {
            [PG.foreignKeyViolation]: conflict(
              "Цей товар є в історії замовлень. Замість видалення вимкніть його.",
            ),
          },
          badRequest("Не вдалося видалити товар."),
          "Admin product delete failed",
        );
      }
    },
  };
}

function toImageRecord(
  row: Tables["product_images"]["Row"],
): ProductImageRecord {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    alt: row.alt,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function createSupabaseProductImageRepository(
  client: SupabaseClient<Database>,
): ProductImageRepository {
  return {
    async listStoragePaths(productId) {
      const { data, error } = await client
        .from("product_images")
        .select("storage_path")
        .eq("product_id", productId);
      if (error) throw error;
      return data.map((image) => image.storage_path);
    },

    async nextSortOrder(productId) {
      const { data, error } = await client
        .from("product_images")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.sort_order ?? -1) + 1;
    },

    async create(image) {
      const { data, error } = await client
        .from("product_images")
        .insert({
          product_id: image.productId,
          storage_path: image.storagePath,
          alt: image.alt,
          color: image.color,
          sort_order: image.sortOrder,
        })
        .select(
          "id, product_id, storage_path, alt, color, sort_order, created_at",
        )
        .single();
      if (error || !data) {
        console.error(
          "Product image record creation failed",
          error?.code ?? "empty response",
        );
        throw badRequest("Не вдалося зберегти зображення.");
      }
      return toImageRecord(data);
    },

    async update(productId, imageId, { alt, color, sortOrder }) {
      const { error } = await client
        .from("product_images")
        .update({ alt, color, sort_order: sortOrder })
        .eq("id", imageId)
        .eq("product_id", productId);
      if (error) throw badRequest("Не вдалося оновити зображення.");
    },

    async findStoragePath(productId, imageId) {
      const { data } = await client
        .from("product_images")
        .select("storage_path")
        .eq("id", imageId)
        .eq("product_id", productId)
        .maybeSingle();
      return data?.storage_path ?? null;
    },

    async delete(productId, imageId) {
      const { error } = await client
        .from("product_images")
        .delete()
        .eq("id", imageId)
        .eq("product_id", productId);
      if (error) throw badRequest("Не вдалося видалити зображення.");
    },

    async isUsedByOrders(publicUrl) {
      const { count, error } = await client
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("product_image", publicUrl);
      if (error) {
        console.error("Order image snapshot check failed", error.code);
        return null;
      }
      return (count ?? 0) > 0;
    },
  };
}
