import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { adminProductSchema } from "@/lib/validators/admin-product";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Перевірте дані товару." },
      { status: 400 },
    );
  }

  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Перевірте дані товару." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase.rpc(
    "save_product_with_variants",
    {
      p_product_id: id,
      p_product: Object.fromEntries(
        Object.entries(parsed.data).filter(([key]) => key !== "variants"),
      ),
      p_variants: parsed.data.variants,
    },
  );

  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Артикул або посилання такого товару вже існує." },
        { status: 409 },
      );
    }
    if (error?.code === "P0002") {
      return NextResponse.json(
        { error: "Товар не знайдено." },
        { status: 404 },
      );
    }
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "Обрана категорія недоступна." },
        { status: 400 },
      );
    }
    console.error(
      "Admin product update failed",
      error?.code ?? "empty response",
    );
    return NextResponse.json(
      { error: "Не вдалося зберегти зміни." },
      { status: 400 },
    );
  }

  return NextResponse.json({ id: data });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/products/[id]">,
) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  const { id } = await context.params;

  const { data: imageRows, error: imageError } = await session.supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  if (imageError) {
    return NextResponse.json(
      { error: "Не вдалося підготувати видалення товару." },
      { status: 500 },
    );
  }

  const { error } = await session.supabase
    .from("products")
    .delete()
    .eq("id", id);
  if (error?.code === "23503") {
    return NextResponse.json(
      {
        error:
          "Цей товар є в історії замовлень. Замість видалення вимкніть його.",
      },
      { status: 409 },
    );
  }
  if (error) {
    console.error("Admin product delete failed", error.code);
    return NextResponse.json(
      { error: "Не вдалося видалити товар." },
      { status: 400 },
    );
  }

  const paths = imageRows?.map((image) => image.storage_path) ?? [];
  if (paths.length) {
    const { error: storageError } = await session.supabase.storage
      .from("product-images")
      .remove(paths);
    if (storageError)
      console.error("Product image cleanup failed", storageError.name);
  }

  return NextResponse.json({ ok: true });
}
