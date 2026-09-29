import { requireAdminServices } from "@/lib/server/admin-services";
import {
  AdminProductForm,
  type ProductCategoryOption,
} from "@/components/admin/admin-product-form";

export default async function NewAdminProductPage() {
  const services = await requireAdminServices();
  const categories: ProductCategoryOption[] = await services.categories
    .listOptions({ activeOnly: true })
    .catch(() => []);

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Каталог · новий товар
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Додати товар</h1>
      {categories.length ? (
        <AdminProductForm categories={categories} />
      ) : (
        <p className="mt-8 max-w-xl rounded-[var(--radius-card)] border border-border bg-surface p-5 text-sm text-muted">
          Щоб додати товар, спершу потрібна активна категорія. Зверніться до
          власника магазину для налаштування категорій.
        </p>
      )}
    </>
  );
}
