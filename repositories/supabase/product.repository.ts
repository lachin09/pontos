import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { Product } from "@/types/product";
import type { ProductRepository } from "@/repositories/product.repository";

const productSelection = `
  id, category_id, name, slug, description, composition, care_instructions,
  price, old_price, is_available, is_featured, is_new, is_sale, created_at,
  updated_at,
  product_images (id, product_id, storage_path, alt, sort_order, created_at),
  product_variants (id, product_id, sku, size, color, color_hex, price, stock,
    is_available, created_at, updated_at)
`;

type ProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  product_images: Database["public"]["Tables"]["product_images"]["Row"][];
  product_variants: Database["public"]["Tables"]["product_variants"]["Row"][];
};

function toProduct(row: ProductRow, client: SupabaseClient<Database>): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    composition: row.composition,
    careInstructions: row.care_instructions,
    categoryId: row.category_id,
    price: row.price,
    oldPrice: row.old_price,
    images: row.product_images
      .toSorted((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        productId: image.product_id,
        url: client.storage
          .from("product-images")
          .getPublicUrl(image.storage_path).data.publicUrl,
        alt: image.alt,
        sortOrder: image.sort_order,
        createdAt: image.created_at,
      })),
    variants: row.product_variants.map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.color_hex,
      price: variant.price,
      stock: variant.stock,
      isAvailable: variant.is_available && variant.stock > 0,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    })),
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
    isNew: row.is_new,
    isSale: row.is_sale,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseProductRepository(): ProductRepository {
  return {
    async list() {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("products")
        .select(productSelection)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load published products from Supabase", error);
        throw new Error("Не вдалося завантажити товари.");
      }
      return (data as ProductRow[]).map((row) => toProduct(row, client));
    },
    async getBySlug(slug) {
      const client = createSupabaseServerClient();
      const { data, error } = await client
        .from("products")
        .select(productSelection)
        .eq("is_published", true)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw new Error("Не вдалося завантажити товар.");
      return data ? toProduct(data as ProductRow, client) : null;
    },
  };
}
