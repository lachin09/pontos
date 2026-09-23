import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export const metadata: Metadata = {
  title: "Адміністрування",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        Захищена зона
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">
        Панель адміністратора
      </h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-[var(--radius-card)] border border-border bg-surface p-6 transition-colors hover:border-focus sm:p-8"
        >
          <LockKeyhole className="text-accent" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-lg font-medium">Керування товарами</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Додавайте позиції, фото, варіанти та оновлюйте залишки.
          </p>
          <span className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
            Відкрити товари
          </span>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-[var(--radius-card)] border border-border bg-surface p-6 transition-colors hover:border-focus sm:p-8"
        >
          <LockKeyhole className="text-accent" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-lg font-medium">Керування замовленнями</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Перевіряйте покупки клієнтів, доставку та платежі.
          </p>
          <span className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
            Відкрити замовлення
          </span>
        </Link>
      </div>
    </>
  );
}
