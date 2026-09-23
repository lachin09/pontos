"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/constants/order";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants/order-labels";
import { formatPrice } from "@/lib/utils/format";

export interface AdminOrderRow {
  id: string;
  orderNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  itemCount: number;
}

export function AdminOrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const filtered = useMemo(() => orders.filter((order) => {
    const q = query.trim().toLocaleLowerCase("uk");
    const matchesQuery = !q || `#${order.orderNumber} ${order.firstName} ${order.lastName} ${order.phone} ${order.email ?? ""}`.toLocaleLowerCase("uk").includes(q);
    return matchesQuery && (status === "all" || order.status === status) && (paymentStatus === "all" || order.paymentStatus === paymentStatus);
  }), [orders, query, status, paymentStatus]);
  const date = (value: string) => new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return <section className="mt-8">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="grid gap-1 text-xs text-muted">Пошук<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="№, ім’я, телефон, email" className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus" /></label>
      <label className="grid gap-1 text-xs text-muted">Статус замовлення<select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground"><option value="all">Усі</option>{ORDER_STATUSES.map((value) => <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>)}</select></label>
      <label className="grid gap-1 text-xs text-muted">Статус оплати<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground"><option value="all">Усі</option>{PAYMENT_STATUSES.map((value) => <option key={value} value={value}>{PAYMENT_STATUS_LABELS[value]}</option>)}</select></label>
    </div>
    <p className="mt-4 text-xs text-muted">Показано {filtered.length} з {orders.length}</p>
    {filtered.length === 0 ? <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center"><p className="font-medium">{orders.length ? "Замовлень не знайдено" : "Замовлень ще немає"}</p><p className="mt-2 text-sm text-muted">{orders.length ? "Змініть пошук або фільтри." : "Нові замовлення з’являться тут."}</p></div> : <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-[0.68rem] uppercase tracking-[0.12em] text-muted"><tr><th className="px-5 py-3">Замовлення</th><th className="px-4 py-3">Покупець</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Оплата</th><th className="px-4 py-3">Сума</th><th className="px-4 py-3">Дата</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((order) => <tr key={order.id} className="hover:bg-surface-muted/50"><td className="px-5 py-4"><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/orders/${order.id}`}>#{order.orderNumber}</Link><span className="ml-2 text-xs text-muted">{order.itemCount} од.</span></td><td className="px-4 py-4">{order.firstName} {order.lastName}<p className="mt-1 text-xs text-muted">{order.phone}</p></td><td className="px-4 py-4">{ORDER_STATUS_LABELS[order.status]}</td><td className="px-4 py-4">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</td><td className="px-4 py-4 tabular-nums">{formatPrice(order.total)}</td><td className="px-4 py-4 text-xs text-muted">{date(order.createdAt)}</td></tr>)}</tbody></table></div>}
  </section>;
}
