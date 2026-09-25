import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { Category } from "@/types/category";
import { badRequest, conflict } from "@/lib/errors";
import { PG, translateDbError } from "@/lib/supabase/db-error";
import type {
  CategoryAdminRepository,
  CategoryRepository,
} from "@/repositories/category.repository";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

const categoryColumns =
  "id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at";

function toCategory(
  row: CategoryRow,
  client: SupabaseClient<Database>,
): Category {
  let imageUrl = row.image_url;
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = client.storage.from("product-images").getPublicUrl(imageUrl)
      .data.publicUrl;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseCategoryRepository(): CategoryRepository {
  return {
    async listActive() {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("categories")
        .select(categoryColumns)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Failed to load active categories from Supabase", error);
        throw new Error("Не вдалося завантажити категорії.");
      }
      return data.map((row) => toCategory(row, client));
    },
    async getActiveBySlug(slug) {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("categories")
        .select(categoryColumns)
        .eq("is_active", true)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw new Error("Не вдалося завантажити категорію.");
      return data ? toCategory(data, client) : null;
    },
  };
}

const duplicateSlug = () => conflict("Категорія з таким посиланням уже існує.");

export function createSupabaseCategoryAdminRepository(
  client: SupabaseClient<Database>,
): CategoryAdminRepository {
  return {
    async listAll() {
      const { data, error } = await client
        .from("categories")
        .select(categoryColumns)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data.map((row) => toCategory(row, client));
    },

    async listOptions({ activeOnly = false } = {}) {
      let query = client.from("categories").select("id, name");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query.order("sort_order");
      if (error) throw error;
      return data.map(({ id, name }) => ({ id, name }));
    },

    async create(category) {
      const { data, error } = await client
        .from("categories")
        .insert(category)
        .select("id")
        .single();
      if (error) {
        throw translateDbError(
          error,
          { [PG.uniqueViolation]: duplicateSlug() },
          badRequest("Не вдалося створити категорію."),
        );
      }
      return data.id;
    },

    async update(id, category) {
      const { data, error } = await client
        .from("categories")
        .update(category)
        .eq("id", id)
        .select("id")
        .maybeSingle();
      const fallback = badRequest("Не вдалося зберегти категорію.");
      if (error) {
        throw translateDbError(
          error,
          { [PG.uniqueViolation]: duplicateSlug() },
          fallback,
        );
      }
      if (!data) throw fallback;
      return data.id;
    },

    async delete(id) {
      const { error } = await client.from("categories").delete().eq("id", id);
      if (error) {
        throw translateDbError(
          error,
          {
            [PG.foreignKeyViolation]: conflict(
              "У категорії є товари. Спершу перенесіть товари або вимкніть категорію.",
            ),
          },
          badRequest("Не вдалося видалити категорію."),
        );
      }
    },

    async findImage(id) {
      const { data, error } = await client
        .from("categories")
        .select("image_url")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return undefined;
      return data.image_url;
    },

    async setImage(id, image) {
      const { error } = await client
        .from("categories")
        .update({ image_url: image })
        .eq("id", id);
      if (error) throw error;
    },

    async listIds() {
      const { data, error } = await client.from("categories").select("id");
      if (error) throw error;
      return data.map((row) => row.id);
    },

    async setSortOrder(id, sortOrder) {
      const { error } = await client
        .from("categories")
        .update({ sort_order: sortOrder })
        .eq("id", id);
      if (error) throw badRequest("Не вдалося змінити порядок.");
    },
  };
}
