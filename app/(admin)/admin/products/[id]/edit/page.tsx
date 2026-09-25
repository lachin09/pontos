import { notFound } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type { Database } from "@/lib/supabase/database.types";
import {
  AdminProductForm,
  type ProductImageDraft,
  type ProductVariantDraft,
} from "@/components/admin/admin-product-form";

export default async function EditAdminProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const supabase = await createSupabaseAuthServerClient();
  const [{ data: product, error }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, slug, description, composition, care_instructions, price, old_price, is_published, is_available, is_featured, is_new, is_sale, product_images(id, product_id, storage_path, alt, color, sort_order, created_at), product_variants(id, product_id, sku, size, color, color_hex, price, stock, is_available, created_at, updated_at)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);

  if (error || !product || !categoryRows?.length) notFound();
  type ProductRow = Database["public"]["Tables"]["products"]["Row"] & {
    product_images: Database["public"]["Tables"]["product_images"]["Row"][];
    product_variants: Database["public"]["Tables"]["product_variants"]["Row"][];
  };
  const productRow = product as ProductRow;
  const images: ProductImageDraft[] = productRow.product_images
    .toSorted((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      url: supabase.storage
        .from("product-images")
        .getPublicUrl(image.storage_path).data.publicUrl,
      alt: image.alt,
      color: image.color,
      sortOrder: image.sort_order,
    }));
  const variants: ProductVariantDraft[] = productRow.product_variants
    .toSorted(
      (a, b) => a.size.localeCompare(b.size) || a.color.localeCompare(b.color),
    )
    .map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      color_hex: variant.color_hex,
      price: String(variant.price),
      stock: String(variant.stock),
      is_available: variant.is_available,
    }));

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Каталог · редагування
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">
        {productRow.name}
      </h1>
      <AdminProductForm
        categories={categoryRows.map(({ id: categoryId, name }) => ({
          id: categoryId,
          name,
        }))}
        initialProduct={{
          id: productRow.id,
          category_id: productRow.category_id,
          name: productRow.name,
          slug: productRow.slug,
          description: productRow.description,
          composition: productRow.composition,
          care_instructions: productRow.care_instructions,
          price: String(productRow.price),
          old_price:
            productRow.old_price == null ? "" : String(productRow.old_price),
          is_published: productRow.is_published,
          is_available: productRow.is_available,
          is_featured: productRow.is_featured,
          is_new: productRow.is_new,
          is_sale: productRow.is_sale,
          variants,
        }}
        initialImages={images}
      />
    </>
  );
}
