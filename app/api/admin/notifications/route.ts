import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";

const markReadSchema = z.object({ id: z.string().uuid() });

export async function GET() {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const [recent, unread] = await Promise.all([
    session.supabase.from("admin_notifications").select("id, order_id, order_number, title, message, is_read, created_at").order("created_at", { ascending: false }).limit(10),
    session.supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);
  if (recent.error || unread.error) return NextResponse.json({ error: "Не вдалося завантажити сповіщення." }, { status: 500 });
  return NextResponse.json({ notifications: recent.data ?? [], unreadCount: unread.count ?? 0 });
}

export async function PATCH(request: Request) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Некоректний запит." }, { status: 400 }); }
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Сповіщення не знайдено." }, { status: 400 });
  const { data, error } = await session.supabase.from("admin_notifications").update({ is_read: true }).eq("id", parsed.data.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Не вдалося оновити сповіщення." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Сповіщення не знайдено." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
