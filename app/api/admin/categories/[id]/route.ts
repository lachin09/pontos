import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { adminCategorySchema } from "@/lib/validators/admin-category";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { CACHE_TAGS } from "@/lib/data/cache-tags";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Перевірте дані категорії." }, { status: 400 }); }
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Перевірте дані категорії." }, { status: 400 });
  const { data, error } = await session.supabase.from("categories").update(parsed.data).eq("id", id).select("id").maybeSingle();
  if (error?.code === "23505") return NextResponse.json({ error: "Категорія з таким посиланням уже існує." }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "Не вдалося зберегти категорію." }, { status: 400 });
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ id: data.id });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const { id } = await context.params;
  const { data: category, error: readError } = await session.supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  if (readError || !category) return NextResponse.json({ error: "Категорію не знайдено." }, { status: 404 });
  const { error } = await session.supabase.from("categories").delete().eq("id", id);
  if (error?.code === "23503") return NextResponse.json({ error: "У категорії є товари. Спершу перенесіть товари або вимкніть категорію." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Не вдалося видалити категорію." }, { status: 400 });
  if (category.image_url && !/^https?:\/\//i.test(category.image_url)) {
    const { error: storageError } = await session.supabase.storage.from("product-images").remove([category.image_url]);
    if (storageError) console.error("Category image cleanup failed", storageError.name);
  }
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ ok: true });
}
