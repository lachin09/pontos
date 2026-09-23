import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const categories = (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.image_url && !/^https?:\/\//i.test(category.image_url)
      ? supabase.storage.from("product-images").getPublicUrl(category.image_url).data.publicUrl
      : category.image_url,
    sortOrder: category.sort_order,
    isActive: category.is_active,
  }));

  return <>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Каталог</p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Категорії</h1>
      <p className="mt-2 text-sm text-muted">Створюйте розділи каталогу, змінюйте порядок і керуйте видимістю.</p>
    </div>
    {error ? <p className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger" role="alert">Не вдалося завантажити категорії.</p> : <AdminCategoriesManager initialCategories={categories} />}
  </>;
}
