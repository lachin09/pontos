import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { adminProductSchema } from "@/lib/validators/admin-product";

export async function POST(request: Request) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );

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
      p_product_id: "",
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
    console.error(
      "Admin product create failed",
      error?.code ?? "empty response",
    );
    return NextResponse.json(
      { error: "Не вдалося зберегти товар." },
      { status: 400 },
    );
  }

  return NextResponse.json({ id: data }, { status: 201 });
}
