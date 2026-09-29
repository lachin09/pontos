import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Вхід адміністратора",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-page py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-muted"
        >
          PONTOS · essentials
        </Link>
        <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Захищений доступ
          </p>
          <h1 className="mt-2 text-2xl font-medium">Вхід до адмінпанелі</h1>
          <p className="mt-2 text-sm text-muted">
            Увійти можуть лише облікові записи, яким власник магазину надав
            доступ.
          </p>
          {reason === "unauthorized" ? (
            <p
              className="mt-5 rounded-md bg-surface-muted p-3 text-sm text-muted"
              role="status"
            >
              Цей обліковий запис не має дозволу на адмінпанель.
            </p>
          ) : null}
          <AdminLoginForm />
        </section>
        <Link
          className="mt-5 inline-block text-sm text-muted underline underline-offset-4"
          href="/"
        >
          Повернутися до магазину
        </Link>
      </div>
    </main>
  );
}
