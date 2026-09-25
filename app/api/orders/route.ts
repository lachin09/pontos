import { revalidateTag } from "next/cache";
import { z } from "zod";
import { AppError, badRequest } from "@/lib/errors";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { assertSameOrigin, json, readJson, route } from "@/lib/http/route";
import { getOrderPlacement } from "@/lib/server/storefront-services";
import { createOrderSchema } from "@/lib/validators/order";

const idempotencySchema = z.string().uuid();

export const POST = route(async (request) => {
  assertSameOrigin(request);
  // Checked before the body so a missing key never creates an order.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new AppError("Некоректний формат запиту.", 415);
  }
  const idempotencyKey = idempotencySchema.safeParse(
    request.headers.get("idempotency-key"),
  );
  if (!idempotencyKey.success) {
    throw badRequest("Не вдалося створити замовлення. Спробуйте ще раз.");
  }
  const order = await readJson(request, createOrderSchema, {
    message: "Некоректний формат замовлення.",
    invalidMessage: "Перевірте контактні дані та товари в кошику.",
  });

  let placed;
  try {
    placed = await getOrderPlacement().place(order, idempotencyKey.data);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Не вдалося оформити замовлення. Спробуйте ще раз або зв’яжіться з нами.",
      500,
    );
  }

  if (placed.wasCreated) {
    // Stock changed; refresh availability in the background.
    revalidateTag(CACHE_TAGS.products, "max");
  }
  return json(
    {
      orderNumber: placed.orderNumber,
      total: placed.total,
      paymentStatus: placed.paymentStatus,
    },
    placed.wasCreated ? 201 : 200,
  );
});
