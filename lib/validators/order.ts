import { z } from "zod";
import { checkoutSchema } from "@/lib/validators/checkout";

export const createOrderSchema = z.object({
  customer: checkoutSchema,
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.variantId)).size === items.length,
      "Duplicate variants are not allowed",
    ),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
