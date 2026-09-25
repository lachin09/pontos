"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants/order";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/order-labels";
import { formatPrice } from "@/lib/utils/format";
import { adminOrdersApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";

export interface AdminOrderRow {
  id: string;
  orderNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  itemCount: number;
}

function OrderStatusEditor({ order }: { order: AdminOrderRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await adminOrdersApi.updateStatus(order.id, {
        status,
        paymentStatus: order.paymentStatus,
      });
      setMessage("Збережено");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Не вдалося з’єднатися із сервером."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`order-status-${order.id}`}>
        Статус замовлення #{order.orderNumber}
      </label>
      <select
        id={`order-status-${order.id}`}
        value={status}
        onChange={(event) => {
          setStatus(event.target.value as OrderStatus);
          setMessage(null);
        }}
        className="min-h-10 rounded-[var(--radius-control)] border border-border bg-background px-2 text-sm"
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => void save()}
        disabled={busy || status === order.status}
        className="min-h-10 rounded-[var(--radius-control)] bg-foreground px-3 text-xs font-medium text-background disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy ? "Збереження…" : "Зберегти"}
      </button>
      {message && (
        <span className="w-full text-xs text-muted" role="status">
          {message}
        </span>
      )}
    </div>
  );
}

export function AdminOrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const q = query.trim().toLocaleLowerCase("uk");
        const matchesQuery =
          !q ||
          `#${order.orderNumber} ${order.firstName} ${order.lastName} ${order.phone}`
            .toLocaleLowerCase("uk")
            .includes(q);
        return (
          matchesQuery &&
          (status === "all" || order.status === status) &&
          (paymentStatus === "all" || order.paymentStatus === paymentStatus)
        );
      }),
    [orders, query, status, paymentStatus],
  );
  const date = (value: string) =>
    new Intl.DateTimeFormat("uk-UA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-xs text-muted">
          Пошук
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="№, ім’я, телефон"
            className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-focus"
          />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Статус замовлення
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="all">Усі</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Статус оплати
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="all">Усі</option>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PAYMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-4 text-xs text-muted">
        Показано {filtered.length} з {orders.length}
      </p>
      {filtered.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
          <p className="font-medium">
            {orders.length ? "Замовлень не знайдено" : "Замовлень ще немає"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {orders.length
              ? "Змініть пошук або фільтри."
              : "Нові замовлення з’являться тут."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-[0.68rem] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3">Замовлення</th>
                <th className="px-4 py-3">Покупець</th>
                <th className="px-4 py-3">Статус замовлення</th>
                <th className="px-4 py-3">Оплата</th>
                <th className="px-4 py-3">Сума</th>
                <th className="px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-surface-muted/50">
                  <td className="px-5 py-4">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/admin/orders/${order.id}`}
                    >
                      #{order.orderNumber}
                    </Link>
                    <span className="ml-2 text-xs text-muted">
                      {order.itemCount} од.
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {order.firstName} {order.lastName}
                    <p className="mt-1 text-xs text-muted">{order.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <OrderStatusEditor
                      key={`${order.id}-${order.status}`}
                      order={order}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted">
                    {date(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
