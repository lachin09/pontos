import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { Category } from "@/types/category";
import type { CategoryRepository } from "@/repositories/category.repository";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

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
        .select(
          "id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at",
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw new Error("Не вдалося завантажити категорії.");
      return data.map((row) => toCategory(row, client));
    },
    async getActiveBySlug(slug) {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("categories")
        .select(
          "id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at",
        )
        .eq("is_active", true)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw new Error("Не вдалося завантажити категорію.");
      return data ? toCategory(data, client) : null;
    },
    async listAll() {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("categories")
        .select(
          "id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at",
        )
        .order("sort_order", { ascending: true });
      if (error) throw new Error("Не вдалося завантажити категорії.");
      return data.map((row) => toCategory(row, client));
    },
  };
}
