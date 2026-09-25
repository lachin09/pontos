import { ApiError, apiRequest } from "@/lib/api/client";
import type { PaymentStatus } from "@/lib/constants/order";
import type { CreateOrderInput } from "@/lib/validators/order";

/** Typed call to the public order API used by checkout. */

export type OrderConfirmation = {
  orderNumber: number;
  total: number;
  paymentStatus: PaymentStatus;
};

export const ordersApi = {
  /** Safe to retry with the same key: the server returns the first order. */
  async place(order: CreateOrderInput, idempotencyKey: string) {
    const result = await apiRequest<Partial<OrderConfirmation>>("/api/orders", {
      method: "POST",
      body: order,
      headers: { "Idempotency-Key": idempotencyKey },
      fallbackError: "Не вдалося оформити замовлення. Спробуйте ще раз.",
    });
    if (
      result?.orderNumber == null ||
      result.total == null ||
      !result.paymentStatus
    ) {
      throw new ApiError(
        "Не вдалося оформити замовлення. Спробуйте ще раз.",
        500,
      );
    }
    return result as OrderConfirmation;
  },
};
