import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { adminCategoryReorderSchema, adminCategorySchema } from "@/lib/validators/admin-category";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { CACHE_TAGS } from "@/lib/data/cache-tags";

export async function POST(request: Request) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Перевірте дані категорії." }, { status: 400 }); }
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Перевірте дані категорії." }, { status: 400 });
  const { data, error } = await session.supabase.from("categories").insert(parsed.data).select("id").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Категорія з таким посиланням уже існує." }, { status: 409 });
  if (error || !data) return NextResponse.json({ error: "Не вдалося створити категорію." }, { status: 400 });
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Перевірте порядок категорій." }, { status: 400 }); }
  const parsed = adminCategoryReorderSchema.safeParse(body);
  if (!parsed.success || new Set(parsed.data.ids).size !== parsed.data.ids.length) return NextResponse.json({ error: "Перевірте порядок категорій." }, { status: 400 });
  const { data: rows, error: readError } = await session.supabase.from("categories").select("id");
  if (readError || !rows || rows.length !== parsed.data.ids.length || rows.some((row) => !parsed.data.ids.includes(row.id))) {
    return NextResponse.json({ error: "Список категорій змінився. Оновіть сторінку." }, { status: 409 });
  }
  for (const [sort_order, id] of parsed.data.ids.entries()) {
    const { error } = await session.supabase.from("categories").update({ sort_order }).eq("id", id);
    if (error) return NextResponse.json({ error: "Не вдалося змінити порядок." }, { status: 400 });
  }
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ ok: true });
}
