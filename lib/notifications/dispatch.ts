import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants/order-labels";
import type { DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/constants/order";

type OutboxRow = {
  id: string;
  recipient_email: string;
  recipient_type: string;
  event_type: string;
  payload: Json;
  attempts: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
function string(payload: Record<string, Json | undefined>, key: string, fallback = "") {
  const value = payload[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

async function sendEmail(row: OutboxRow) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PONTOS_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const payload = (row.payload ?? {}) as Record<string, Json | undefined>;
  const number = string(payload, "order_number");
  const firstName = string(payload, "first_name", "Покупцю");
  const title = row.event_type === "order_created" ? `Замовлення #${number} отримано` : `Оновлення замовлення #${number}`;
  const status = string(payload, "status");
  const paymentStatus = string(payload, "payment_status");
  const total = string(payload, "total");
  const statusText = status ? `Статус замовлення: ${ORDER_STATUS_LABELS[status as OrderStatus] ?? status}.` : "Ми вже отримали ваше замовлення.";
  const paymentText = paymentStatus ? `Статус оплати: ${PAYMENT_STATUS_LABELS[paymentStatus as PaymentStatus] ?? paymentStatus}.` : "";
  const itemRows = Array.isArray(payload.items) ? payload.items : [];
  const itemsText = itemRows.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return "";
    const detail = item as Record<string, Json | undefined>;
    return `• ${string(detail, "name")} · ${string(detail, "color")} / ${string(detail, "size")} × ${string(detail, "quantity")}`;
  }).filter(Boolean).join("\n");
  const deliveryMethod = string(payload, "delivery_method");
  const paymentMethod = string(payload, "payment_method");
  const adminText = row.recipient_type === "admin"
    ? `Покупець: ${firstName} ${string(payload, "last_name")} · ${string(payload, "phone")} · ${string(payload, "customer_email")}\nСума: ${total} ₴.\nДоставка: ${DELIVERY_METHOD_LABELS[deliveryMethod as DeliveryMethod] ?? deliveryMethod}, ${string(payload, "city")}, ${string(payload, "delivery_address")}\nОплата: ${PAYMENT_METHOD_LABELS[paymentMethod as PaymentMethod] ?? paymentMethod}\n${itemsText}`
    : `${statusText} ${paymentText}`;
  const greeting = row.recipient_type === "customer" ? `Вітаємо, ${firstName}!` : "Нове замовлення в PONTOS";
  const text = `${greeting}\n\n${title}.\n${adminText}\n\nPONTOS`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#191919"><p>${escapeHtml(greeting)}</p><h1 style="font-size:22px">${escapeHtml(title)}</h1><p>${escapeHtml(adminText).replace(/\n/g, "<br>")}</p><p>PONTOS</p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `pontos-outbox-${row.id}` },
    body: JSON.stringify({ from, to: [row.recipient_email], subject: title, text, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

export async function dispatchPendingNotifications(options: { orderNumber?: number; limit?: number } = {}) {
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try { supabase = createSupabaseAdminClient(); } catch { return; }
  let query = supabase.from("notification_outbox").select("id, recipient_email, recipient_type, event_type, payload, attempts").is("sent_at", null).order("created_at", { ascending: true }).limit(options.limit ?? 10);
  if (options.orderNumber !== undefined) {
    const { data: order } = await supabase.from("orders").select("id").eq("order_number", options.orderNumber).maybeSingle();
    if (!order) return;
    query = query.eq("order_id", order.id);
  }
  const { data, error } = await query;
  if (error || !data) return;
  for (const row of data as OutboxRow[]) {
    try {
      await sendEmail(row);
      await supabase.from("notification_outbox").update({ sent_at: new Date().toISOString(), attempts: row.attempts + 1, last_error: null }).eq("id", row.id).is("sent_at", null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email delivery failed";
      await supabase.from("notification_outbox").update({ attempts: row.attempts + 1, last_error: message.slice(0, 300) }).eq("id", row.id).is("sent_at", null);
    }
  }
}
