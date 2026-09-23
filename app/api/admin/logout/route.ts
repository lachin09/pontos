import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Запит не вдалося перевірити." },
      { status: 403 },
    );
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Не вдалося вийти з облікового запису." },
      { status: 503 },
    );
  }
}
