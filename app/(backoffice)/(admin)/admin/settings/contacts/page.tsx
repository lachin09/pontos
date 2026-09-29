import type { Metadata } from "next";
import { AdminContactLinksEditor } from "@/components/admin/admin-contact-links-editor";
import { requireAdminServices } from "@/lib/server/admin-services";

export const metadata: Metadata = {
  title: "Контакти",
  robots: { index: false, follow: false },
};

export default async function AdminContactSettingsPage() {
  const services = await requireAdminServices();
  const links = await services.settings.getContactLinks().catch(() => null);

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Магазин
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Контакти</h1>
        <p className="mt-2 text-sm text-muted">
          Керуйте посиланнями у плаваючій кнопці зв’язку.
        </p>
      </div>
      {links === null ? (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити контакти.
        </p>
      ) : (
        <AdminContactLinksEditor initialLinks={links} />
      )}
    </>
  );
}
