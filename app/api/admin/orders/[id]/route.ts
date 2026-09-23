import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants/order";
import { dispatchPendingNotifications } from "@/lib/notifications/dispatch";

const updateSchema = z.object({ status: z.enum(ORDER_STATUSES), paymentStatus: z.enum(PAYMENT_STATUSES) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getActiveAdminSession();
  if (!session) return NextResponse.json({ error: "Потрібен доступ адміністратора." }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Перевірте статуси замовлення." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Оберіть коректні статуси." }, { status: 400 });
  const { data, error } = await session.supabase.rpc("update_order_admin", { p_order_id: id, p_status: parsed.data.status, p_payment_status: parsed.data.paymentStatus });
  if (error) return NextResponse.json({ error: "Не вдалося оновити замовлення." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Замовлення не знайдено." }, { status: 404 });
  const { data: order } = await session.supabase.from("orders").select("order_number").eq("id", id).maybeSingle();
  if (order) await dispatchPendingNotifications({ orderNumber: order.order_number });
  return NextResponse.json({ ok: true });
}
