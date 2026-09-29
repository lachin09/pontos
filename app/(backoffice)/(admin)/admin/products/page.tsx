import Link from "next/link";
import { requireAdminServices } from "@/lib/server/admin-services";
import { AdminProductsTable } from "@/components/admin/admin-products-table";

export default async function AdminProductsPage() {
  const services = await requireAdminServices();
  const [products, categories] = await Promise.all([
    services.products.list().catch(() => null),
    services.categories.listOptions().catch(() => []),
  ]);
  const error = products === null;

  const categoryNames = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
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
          products={(products ?? []).map(({ categoryId, ...product }) => ({
            ...product,
            category: categoryNames[categoryId] ?? "Без категорії",
          }))}
        />
      )}
    </>
  );
}
