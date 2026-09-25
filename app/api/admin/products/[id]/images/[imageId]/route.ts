import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { CACHE_TAGS } from "@/lib/data/cache-tags";

const imageUpdateSchema = z.object({
  alt: z.string().trim().max(200),
  color: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .optional()
    .transform((val) => (val ? val : null)),
  sortOrder: z.number().int().min(0).max(1000),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]/images/[imageId]">,
) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  const { id: productId, imageId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Перевірте дані зображення." },
      { status: 400 },
    );
  }
  const parsed = imageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Перевірте опис та порядок зображення." },
      { status: 400 },
    );
  }

  const { error } = await session.supabase
    .from("product_images")
    .update({
      alt: parsed.data.alt,
      color: parsed.data.color,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) {
    return NextResponse.json(
      { error: "Не вдалося оновити зображення." },
      { status: 400 },
    );
  }
  revalidateStorefront(CACHE_TAGS.products);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/products/[id]/images/[imageId]">,
) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  const { id: productId, imageId } = await context.params;

  const { data: image } = await session.supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  if (!image)
    return NextResponse.json(
      { error: "Зображення не знайдено." },
      { status: 404 },
    );

  const { error } = await session.supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) {
    return NextResponse.json(
      { error: "Не вдалося видалити зображення." },
      { status: 400 },
    );
  }

  const publicUrl = session.supabase.storage
    .from("product-images")
    .getPublicUrl(image.storage_path).data.publicUrl;
  const { count, error: snapshotError } = await session.supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_image", publicUrl);
  if (snapshotError) {
    console.error("Order image snapshot check failed", snapshotError.code);
  } else if (count === 0) {
    const { error: storageError } = await session.supabase.storage
      .from("product-images")
      .remove([image.storage_path]);
    if (storageError)
      console.error("Product image cleanup failed", storageError.name);
  }
  revalidateStorefront(CACHE_TAGS.products);
  return NextResponse.json({ ok: true });
}
