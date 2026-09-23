import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-page">
          <div className="flex items-center gap-5">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-[0.2em]"
            >
              PONTOS{" "}
              <span className="font-normal text-muted">/ Адміністрування</span>
            </Link>
            <Link
              href="/admin/products"
              className="hidden text-sm text-muted hover:text-foreground sm:inline"
            >
              Товари
            </Link>
            <Link
              href="/admin/categories"
              className="hidden text-sm text-muted hover:text-foreground sm:inline"
            >
              Категорії
            </Link>
            <Link
              href="/admin/orders"
              className="hidden text-sm text-muted hover:text-foreground sm:inline"
            >
              Замовлення
            </Link>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-page py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
