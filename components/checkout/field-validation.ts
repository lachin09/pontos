import type { FieldPath } from "react-hook-form";
import { checkoutSchema, type CheckoutData } from "@/lib/validators/checkout";

/**
 * Per-field validation for react-hook-form, using the same schema the server
 * checks. Cross-field rules run on submit (see checkout-form.tsx).
 */
export const validateField =
  (name: FieldPath<CheckoutData>) => (value: unknown) => {
    const result = checkoutSchema.shape[name].safeParse(value);
    return (
      result.success || result.error.issues[0]?.message || "Перевірте це поле"
    );
  };
