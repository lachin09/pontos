import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.from("orders").select("id, order_number, first_name, last_name, phone, city, total, status, payment_status, created_at, order_items(count)").order("created_at", { ascending: false }).limit(500);
  return <>
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Продажі</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Замовлення</h1><p className="mt-2 text-sm text-muted">Переглядайте покупки та оновлюйте їхні статуси.</p></div>
    {error ? <p className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger" role="alert">Не вдалося завантажити замовлення.</p> : <AdminOrdersTable orders={(data ?? []).map((order) => ({ id: order.id, orderNumber: order.order_number, firstName: order.first_name, lastName: order.last_name, phone: order.phone, city: order.city, total: Number(order.total), status: order.status, paymentStatus: order.payment_status, createdAt: order.created_at, itemCount: order.order_items[0]?.count ?? 0 }))} />}
  </>;
}
