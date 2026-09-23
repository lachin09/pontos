"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

interface AdminNotification {
  id: string;
  order_id: string;
  order_number: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const result: { notifications: AdminNotification[]; unreadCount: number } = await response.json();
        if (active) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);
        }
      } catch {
        // A later polling cycle will retry if the request fails.
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const openOrder = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id }),
      });
      if (response.ok) {
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    }
    setOpen(false);
    router.push(`/admin/orders/${notification.order_id}`);
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat("uk-UA", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

  return <div className="relative">
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-label={`Сповіщення${unreadCount ? `, непрочитаних: ${unreadCount}` : ""}`}
      aria-expanded={open}
      aria-haspopup="true"
      className="relative grid size-10 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground"
    >
      <Bell size={18} aria-hidden="true" />
      {unreadCount > 0 && <span className="absolute right-0 top-0 grid min-w-5 translate-x-1/4 -translate-y-1/4 place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-semibold leading-5 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
    {open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-semibold">Сповіщення</p><span className="text-xs text-muted">{unreadCount} нових</span></div>
      {notifications.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted">Нових замовлень поки немає.</p> : <ul className="max-h-[min(60vh,24rem)] overflow-y-auto divide-y divide-border">{notifications.map((item) => <li key={item.id}><button type="button" onClick={() => void openOrder(item)} className={`w-full px-4 py-3 text-left hover:bg-surface-muted ${item.is_read ? "opacity-65" : ""}`}><span className="flex items-start justify-between gap-3"><span className="text-sm font-medium">{item.title}</span>{!item.is_read && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" aria-label="Нове" />}</span><span className="mt-1 block text-xs text-muted">{item.message}</span><span className="mt-2 block text-[0.68rem] text-muted">{formatDate(item.created_at)}</span></button></li>)}</ul>}
      <Link href="/admin/orders" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-3 text-center text-xs font-medium underline underline-offset-4">Відкрити замовлення</Link>
    </div>}
  </div>;
}
