import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/constants/order";
import { DELIVERY_COUNTRIES } from "@/lib/constants/countries";
import type { Locale } from "@/lib/i18n/config";
import { fill, getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Checkout rules. The server and the browser share them; messages come from
 * the visitor's language so the form can show them as they are.
 */
export function createCheckoutSchema(locale: Locale = "uk") {
  const t = getDictionary(locale).checkout;
  const v = t.validation;
  const requiredName = (label: string) =>
    z.string().trim().min(2, fill(v.nameMin, { label })).max(80);

  return z
    .object({
      firstName: requiredName(t.firstName),
      lastName: requiredName(t.lastName),
      phone: z
        .string()
        .trim()
        .regex(/^(?:\+[1-9]\d{6,14}|0\d{9})$/, v.phone),
      city: z.string().trim().min(2, v.city).max(100),
      deliveryCountryCode: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .refine(
          (code) => DELIVERY_COUNTRIES.some((country) => country.code === code),
          v.country,
        ),
      deliveryPostalCode: z.string().trim().max(30, v.postalMax),
      deliveryMethod: z.enum(DELIVERY_METHODS, {
        error: v.method,
      }),
      deliveryAddress: z.string().trim().min(2, v.address).max(200),
      paymentMethod: z.enum(PAYMENT_METHODS, { error: v.payment }),
      comment: z.string().trim().max(500, v.commentMax),
    })
    .superRefine((data, context) => {
      if (
        data.deliveryCountryCode !== "UA" &&
        data.deliveryMethod !== "nova_poshta"
      ) {
        context.addIssue({
          code: "custom",
          path: ["deliveryMethod"],
          message: v.internationalMethod,
        });
      }
      if (
        data.deliveryCountryCode !== "UA" &&
        data.deliveryPostalCode.length < 3
      ) {
        context.addIssue({
          code: "custom",
          path: ["deliveryPostalCode"],
          message: v.postalRequired,
        });
      }
    });
}

const schemas = new Map<Locale, ReturnType<typeof createCheckoutSchema>>();

/** Cached schema per language. */
export function checkoutSchemaFor(locale: Locale) {
  let schema = schemas.get(locale);
  if (!schema) {
    schema = createCheckoutSchema(locale);
    schemas.set(locale, schema);
  }
  return schema;
}

export const checkoutSchema = checkoutSchemaFor("uk");

export type CheckoutData = z.infer<typeof checkoutSchema>;
