import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { adminLoginSchema } from "@/lib/validators/admin-auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Запит не вдалося перевірити." },
      { status: 403 },
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Некоректний формат запиту." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Перевірте введені дані." },
      { status: 400 },
    );
  }

  const credentials = adminLoginSchema.safeParse(body);
  if (!credentials.success) {
    return NextResponse.json(
      { error: "Введіть коректну пошту та пароль." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(
      credentials.data,
    );

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Невірна пошта або пароль." },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: "Цей обліковий запис не має доступу до панелі адміністратора.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не вдалося увійти. Спробуйте трохи пізніше." },
      { status: 503 },
    );
  }
}
