import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { AdminOrderDetails, type AdminOrderDetailsData } from "@/components/admin/admin-order-details";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseAuthServerClient();
  const [{ data: order, error }, { data: history }] = await Promise.all([
    supabase.from("orders").select("id, order_number, first_name, last_name, phone, customer_email, city, delivery_method, delivery_address, payment_method, payment_status, status, comment, subtotal, delivery_price, total, created_at, order_items(id, product_name, product_image, size, color, price, quantity, subtotal)").eq("id", id).maybeSingle(),
    supabase.from("order_status_history").select("id, old_status, new_status, old_payment_status, new_payment_status, created_at").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  if (error || !order) notFound();
  const data: AdminOrderDetailsData = {
    id: order.id,
    orderNumber: order.order_number,
    firstName: order.first_name,
    lastName: order.last_name,
    phone: order.phone,
    email: order.customer_email,
    city: order.city,
    deliveryMethod: order.delivery_method,
    deliveryAddress: order.delivery_address,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: order.status,
    comment: order.comment,
    subtotal: Number(order.subtotal),
    deliveryPrice: Number(order.delivery_price),
    total: Number(order.total),
    createdAt: order.created_at,
    items: order.order_items.map((item) => ({ id: item.id, productName: item.product_name, productImage: item.product_image, size: item.size, color: item.color, price: Number(item.price), quantity: item.quantity, subtotal: Number(item.subtotal) })),
    history: (history ?? []).map((entry) => ({ id: entry.id, oldStatus: entry.old_status, newStatus: entry.new_status, oldPaymentStatus: entry.old_payment_status, newPaymentStatus: entry.new_payment_status, createdAt: entry.created_at })),
  };
  return <><Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft size={16} /> До замовлень</Link><AdminOrderDetails order={data} /></>;
}
