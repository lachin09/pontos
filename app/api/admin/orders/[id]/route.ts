import { z } from "zod";
import { badRequest, notFound } from "@/lib/errors";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants/order";
import { notifyInBackground } from "@/lib/server/storefront-services";

type Context = RouteContext<"/api/admin/orders/[id]">;

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export const PATCH = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id } = await params;
    const { status, paymentStatus } = await readJson(request, updateSchema, {
      message: "Перевірте статуси замовлення.",
      invalidMessage: "Оберіть коректні статуси.",
    });
    let previous;
    let updated: boolean;
    try {
      // Read first so the customer is only told about real changes.
      previous = await services.orders.getStatuses(id);
      updated = await services.orders.updateStatus(id, status, paymentStatus);
    } catch {
      throw badRequest("Не вдалося оновити замовлення.");
    }
    if (!updated || !previous) throw notFound("Замовлення не знайдено.");

    const before = previous;
    notifyInBackground("status update", (notifier) =>
      notifier.notifyStatusChange(id, before),
    );
    return json({ ok: true });
  },
);
