import { z } from "zod";
import { LOCALES } from "@/lib/i18n/config";
import { checkoutSchema } from "@/lib/validators/checkout";

export const createOrderSchema = z.object({
  customer: checkoutSchema,
  /** The storefront language at checkout; Telegram talks to the customer in it. */
  locale: z.enum(LOCALES).default("uk"),
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
      (items) =>
        new Set(items.map((item) => item.variantId)).size === items.length,
      "Duplicate variants are not allowed",
    ),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
