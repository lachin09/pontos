"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants/order";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/order-labels";
import { formatPrice } from "@/lib/utils/format";
import { adminOrdersApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export interface AdminOrderDetailsData {
  id: string;
  orderNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  deliveryMethod: keyof typeof DELIVERY_METHOD_LABELS;
  deliveryAddress: string;
  deliveryCountryName: string;
  deliveryPostalCode: string | null;
  novaPoshtaDivisionId: number | null;
  novaPoshtaDivisionName: string | null;
  paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  comment: string | null;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    size: string;
    color: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  history: {
    id: string;
    oldStatus: OrderStatus;
    newStatus: OrderStatus;
    oldPaymentStatus: PaymentStatus;
    newPaymentStatus: PaymentStatus;
    changedVia: "admin" | "telegram";
    createdAt: string;
  }[];
}

export function AdminOrderDetails({ order }: { order: AdminOrderDetailsData }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const date = (value: string) =>
    new Intl.DateTimeFormat("uk-UA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await adminOrdersApi.updateStatus(order.id, { status, paymentStatus });
      setMessage("Статуси оновлено.");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Не вдалося з’єднатися із сервером."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid content-start gap-6">
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Замовлення #{order.orderNumber}
              </p>
              <h2 className="mt-2 text-xl font-medium">
                {order.firstName} {order.lastName}
              </h2>
              <p className="mt-1 text-xs text-muted">
                Створено {date(order.createdAt)}
              </p>
            </div>
            <div>
              <label className="sr-only" htmlFor="order-status">
                Статус замовлення
              </label>
              <select
                id="order-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as OrderStatus)
                }
                className="min-h-10 rounded-[var(--radius-control)] border border-border bg-background px-3 text-sm"
              >
                {ORDER_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {ORDER_STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Телефон</p>
              <a
                className="mt-1 inline-block underline"
                href={`tel:${order.phone}`}
              >
                {order.phone}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted">Доставка</p>
              <p className="mt-1">
                {DELIVERY_METHOD_LABELS[order.deliveryMethod]} · {order.city},{" "}
                {order.deliveryCountryName}
                {order.deliveryPostalCode
                  ? `, ${order.deliveryPostalCode}`
                  : ""}
                <br />
                {order.novaPoshtaDivisionName
                  ? `${order.novaPoshtaDivisionName}${order.novaPoshtaDivisionId ? ` · ID ${order.novaPoshtaDivisionId}` : ""}`
                  : order.deliveryAddress}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Спосіб оплати</p>
              <p className="mt-1">
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </p>
            </div>
            {order.comment && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted">Коментар</p>
                <p className="mt-1">{order.comment}</p>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-medium">Товари</h2>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.color} · {item.size} · {item.quantity} шт. ×{" "}
                    {formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-medium tabular-nums">
                  {formatPrice(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Товари</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Доставка</dt>
              <dd>
                {order.deliveryPrice
                  ? formatPrice(order.deliveryPrice)
                  : "За тарифом перевізника"}
              </dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-medium">
              <dt>Разом</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
        {order.history.length > 0 && (
          <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-medium">Історія статусів</h2>
            <ul className="mt-4 grid gap-3">
              {order.history.map((entry) => (
                <li
                  key={entry.id}
                  className="border-l-2 border-border pl-3 text-sm"
                >
                  <p>
                    {ORDER_STATUS_LABELS[entry.oldStatus]} →{" "}
                    {ORDER_STATUS_LABELS[entry.newStatus]}
                  </p>
                  <p className="text-xs text-muted">
                    Оплата: {PAYMENT_STATUS_LABELS[entry.oldPaymentStatus]} →{" "}
                    {PAYMENT_STATUS_LABELS[entry.newPaymentStatus]} ·{" "}
                    {date(entry.createdAt)}
                    {entry.changedVia === "telegram" ? " · через Telegram" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <aside className="h-fit rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-medium">Оплата та дії</h2>
        <p className="mt-1 text-xs text-muted">
          Статус оплати окремо від статусу замовлення.
        </p>
        <label className="mt-5 grid gap-1.5 text-sm" htmlFor="payment-status">
          Статус оплати
          <select
            id="payment-status"
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value as PaymentStatus)
            }
            className="min-h-11 rounded-[var(--radius-control)] border border-border bg-background px-3"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {PAYMENT_STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <Button
          className="mt-4 w-full"
          disabled={
            busy ||
            (status === order.status && paymentStatus === order.paymentStatus)
          }
          onClick={() => void save()}
        >
          {busy ? "Збереження…" : "Зберегти статуси"}
        </Button>
        {message && (
          <p className="mt-3 text-sm text-muted" role="status">
            {message}
          </p>
        )}
      </aside>
    </div>
  );
}
