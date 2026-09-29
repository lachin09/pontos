import type { FieldPath } from "react-hook-form";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  checkoutSchemaFor,
  type CheckoutData,
} from "@/lib/validators/checkout";

/**
 * Per-field validation for react-hook-form, using the same rules the server
 * checks, with messages in the page language. Cross-field rules run on
 * submit (see checkout-form.tsx).
 */
export const validateField =
  (name: FieldPath<CheckoutData>, locale: Locale) => (value: unknown) => {
    const result = checkoutSchemaFor(locale).shape[name].safeParse(value);
    return (
      result.success ||
      result.error.issues[0]?.message ||
      getDictionary(locale).checkout.validation.checkField
    );
  };
