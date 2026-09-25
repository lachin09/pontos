import { notFound } from "next/navigation";
import { requireAdminServices } from "@/lib/server/admin-services";
import {
  AdminProductForm,
  type ProductImageDraft,
  type ProductVariantDraft,
} from "@/components/admin/admin-product-form";

export default async function EditAdminProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  const services = await requireAdminServices();
  const [product, categories] = await Promise.all([
    services.products.getById(id).catch(() => null),
    services.categories.listOptions().catch(() => []),
  ]);

  if (!product || !categories.length) notFound();
  const images: ProductImageDraft[] = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
    color: image.color,
    sortOrder: image.sortOrder,
  }));
  const variants: ProductVariantDraft[] = product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    color_hex: variant.colorHex,
    price: String(variant.price),
    stock: String(variant.stock),
    is_available: variant.isAvailable,
  }));

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Каталог · редагування
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">
        {product.name}
      </h1>
      <AdminProductForm
        categories={categories}
        initialProduct={{
          id: product.id,
          category_id: product.categoryId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          composition: product.composition,
          care_instructions: product.careInstructions,
          price: String(product.price),
          old_price: product.oldPrice == null ? "" : String(product.oldPrice),
          is_published: product.isPublished,
          is_available: product.isAvailable,
          is_featured: product.isFeatured,
          is_new: product.isNew,
          is_sale: product.isSale,
          variants,
        }}
        initialImages={images}
      />
    </>
  );
}
