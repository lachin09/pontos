import type { Metadata } from "next";
import { AdminStoreInfoEditor } from "@/components/admin/admin-store-info-editor";
import { requireAdminServices } from "@/lib/server/admin-services";

export const metadata: Metadata = {
  title: "Інформація магазину",
  robots: { index: false, follow: false },
};

export default async function AdminStoreInfoPage() {
  const services = await requireAdminServices();
  const info = await services.settings.getStoreInfo().catch(() => null);

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Магазин
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">
          Інформація магазину
        </h1>
        <p className="mt-2 text-sm text-muted">
          Дані продавця, оферта, доставка, повернення та конфіденційність.
        </p>
      </div>
      {info ? (
        <AdminStoreInfoEditor initialInfo={info} />
      ) : (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити інформацію магазину.
        </p>
      )}
    </>
  );
}
