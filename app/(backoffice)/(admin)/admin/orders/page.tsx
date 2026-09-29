import { requireAdminServices } from "@/lib/server/admin-services";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";

export default async function AdminOrdersPage() {
  const services = await requireAdminServices();
  const orders = await services.orders.list(500).catch(() => null);
  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Продажі
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Замовлення</h1>
        <p className="mt-2 text-sm text-muted">
          Переглядайте покупки та оновлюйте їхні статуси.
        </p>
      </div>
      {orders === null ? (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити замовлення.
        </p>
      ) : (
        <AdminOrdersTable orders={orders} />
      )}
    </>
  );
}
