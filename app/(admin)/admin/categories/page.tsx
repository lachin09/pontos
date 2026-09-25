import { requireAdminServices } from "@/lib/server/admin-services";
import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const services = await requireAdminServices();
  const rows = await services.categories.listAll().catch(() => null);
  const error = rows === null;
  const categories = (rows ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  }));

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Каталог
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Категорії</h1>
        <p className="mt-2 text-sm text-muted">
          Створюйте розділи каталогу, змінюйте порядок і керуйте видимістю.
        </p>
      </div>
      {error ? (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити категорії.
        </p>
      ) : (
        <AdminCategoriesManager initialCategories={categories} />
      )}
    </>
  );
}
