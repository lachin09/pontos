import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import {
  CONTACT_LINKS_SETTING_KEY,
  contactLinksSchema,
} from "@/lib/validators/contact-links";

export async function PUT(request: Request) {
  const session = await getActiveAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Перевірте контактні дані." },
      { status: 400 },
    );
  }

  const parsed = contactLinksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Перевірте контактні дані." },
      { status: 400 },
    );
  }

  if (
    new Set(parsed.data.links.map((link) => link.id)).size !==
    parsed.data.links.length
  ) {
    return NextResponse.json(
      { error: "Контакт повторюється." },
      { status: 400 },
    );
  }

  const { error } = await session.supabase.from("store_settings").upsert(
    {
      key: CONTACT_LINKS_SETTING_KEY,
      value: parsed.data,
    },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Не вдалося зберегти контакти." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
