import Link from "next/link";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { AdminProductsTable } from "@/components/admin/admin-products-table";

export default async function AdminProductsPage() {
  const supabase = await createSupabaseAuthServerClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, category_id, name, slug, price, is_published, is_available, is_featured, is_new, is_sale, updated_at, product_variants(stock, is_available), product_images(id)",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("id, name"),
  ]);

  const categoryNames = Object.fromEntries(
    (categories ?? []).map((category) => [category.id, category.name]),
  );

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Каталог
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">Товари</h1>
          <p className="mt-2 text-sm text-muted">
            Керуйте описом, фото, цінами та залишками.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-medium text-background"
        >
          Додати товар
        </Link>
      </div>
      {error ? (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити список товарів.
        </p>
      ) : (
        <AdminProductsTable
          products={(products ?? []).map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            isPublished: product.is_published,
            isAvailable: product.is_available,
            isFeatured: product.is_featured,
            isNew: product.is_new,
            isSale: product.is_sale,
            category: categoryNames[product.category_id] ?? "Без категорії",
            stock: product.product_variants.reduce(
              (sum, variant) => sum + variant.stock,
              0,
            ),
            imageCount: product.product_images.length,
          }))}
        />
      )}
    </>
  );
}
