import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  AdminProductForm,
  type ProductCategoryOption,
} from "@/components/admin/admin-product-form";

export default async function NewAdminProductPage() {
  const supabase = await createSupabaseAuthServerClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  const categories: ProductCategoryOption[] = (data ?? []).map(
    ({ id, name }) => ({ id, name }),
  );

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
