import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { CACHE_TAGS } from "@/lib/data/cache-tags";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const mimeExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
function detectImageMime(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))) return "image/avif";
  return null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const { id } = await context.params;
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Не вдалося прочитати файл." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Оберіть зображення розміром до 10 МБ." }, { status: 400 });
  const mime = detectImageMime(new Uint8Array(await file.arrayBuffer()));
  if (!mime || mime !== file.type || !mimeExtensions[mime]) return NextResponse.json({ error: "Підтримуються зображення JPG, PNG, WebP та AVIF." }, { status: 400 });
  const { data: category, error: categoryError } = await session.supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  if (categoryError || !category) return NextResponse.json({ error: "Категорію не знайдено." }, { status: 404 });
  const path = `categories/${id}/${crypto.randomUUID()}.${mimeExtensions[mime]}`;
  const { error: uploadError } = await session.supabase.storage.from("product-images").upload(path, file, { contentType: mime, cacheControl: "31536000", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Не вдалося завантажити зображення." }, { status: 400 });
  const { error: updateError } = await session.supabase.from("categories").update({ image_url: path }).eq("id", id);
  if (updateError) {
    await session.supabase.storage.from("product-images").remove([path]);
    return NextResponse.json({ error: "Не вдалося зберегти зображення." }, { status: 400 });
  }
  if (category.image_url && !/^https?:\/\//i.test(category.image_url)) {
    const { error } = await session.supabase.storage.from("product-images").remove([category.image_url]);
    if (error) console.error("Old category image cleanup failed", error.name);
  }
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ imageUrl: session.supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const { id } = await context.params;
  const { data: category, error } = await session.supabase.from("categories").select("image_url").eq("id", id).maybeSingle();
  if (error || !category) return NextResponse.json({ error: "Категорію не знайдено." }, { status: 404 });
  const { error: updateError } = await session.supabase.from("categories").update({ image_url: null }).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Не вдалося видалити зображення." }, { status: 400 });
  if (category.image_url && !/^https?:\/\//i.test(category.image_url)) {
    const { error: storageError } = await session.supabase.storage.from("product-images").remove([category.image_url]);
    if (storageError) console.error("Category image cleanup failed", storageError.name);
  }
  revalidateStorefront(CACHE_TAGS.categories);
  return NextResponse.json({ ok: true });
}
