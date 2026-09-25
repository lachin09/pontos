import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminServices } from "@/lib/server/admin-services";
import {
  AdminOrderDetails,
  type AdminOrderDetailsData,
} from "@/components/admin/admin-order-details";
import { getCountryName } from "@/lib/constants/countries";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const services = await requireAdminServices();
  const order = await services.orders.getDetails(id);
  if (!order) notFound();
  const { deliveryCountryCode, ...details } = order;
  const data: AdminOrderDetailsData = {
    ...details,
    deliveryCountryName: getCountryName(deliveryCountryCode),
  };
  return (
    <>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> До замовлень
      </Link>
      <AdminOrderDetails order={data} />
    </>
  );
}
