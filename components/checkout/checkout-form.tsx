"use client";

import { ArrowRight } from "lucide-react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { DeliverySection } from "@/components/checkout/delivery-section";
import { validateField } from "@/components/checkout/field-validation";
import { FormSection } from "@/components/checkout/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants/order";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-labels";
import { checkoutSchema, type CheckoutData } from "@/lib/validators/checkout";

const emptyCheckout: CheckoutData = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  deliveryCountryCode: "UA",
  deliveryPostalCode: "",
  deliveryMethod: "nova_poshta",
  deliveryAddress: "",
  paymentMethod: "bank_transfer",
  comment: "",
};

const PAYMENT_DESCRIPTIONS: Record<PaymentMethod, string> = {
  bank_transfer: "Реквізити для переказу надійдуть після створення замовлення.",
  cash_on_delivery: "Оплата під час отримання посилки.",
};

/** Collects contact, delivery and payment details; calls onValid with clean data. */
export function CheckoutForm({
  initialData,
  onValid,
}: {
  initialData: CheckoutData | null;
  onValid: (data: CheckoutData) => void;
}) {
  const form = useForm<CheckoutData>({
    defaultValues: { ...emptyCheckout, ...initialData },
    mode: "onBlur",
  });
  const {
    register,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const submit = (data: CheckoutData) => {
    const result = checkoutSchema.safeParse(data);
    if (!result.success) {
      // Cross-field rules only run here, so surface them on the matching
      // field instead of failing silently.
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && field in data) {
          setError(field as FieldPath<CheckoutData>, {
            message: issue.message,
          });
        }
      }
      return;
    }
    onValid(result.data);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(submit)}
        className="order-2 grid gap-7 lg:order-1"
      >
        <FormSection id="customer-heading" step={1} title="Контактні дані">
          <Input
            id="firstName"
            label="Ім’я"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName", { validate: validateField("firstName") })}
          />
          <Input
            id="lastName"
            label="Прізвище"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName", { validate: validateField("lastName") })}
          />
          <Input
            id="phone"
            label="Телефон"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+380…"
            error={errors.phone?.message}
            {...register("phone", { validate: validateField("phone") })}
          />
        </FormSection>

        <DeliverySection />

        <FormSection id="payment-heading" step={3} title="Оплата" asFieldset>
          {PAYMENT_METHODS.map((value) => (
            <Radio
              key={value}
              id={`payment-${value}`}
              value={value}
              label={PAYMENT_METHOD_LABELS[value]}
              description={PAYMENT_DESCRIPTIONS[value]}
              {...register("paymentMethod", {
                validate: validateField("paymentMethod"),
              })}
            />
          ))}
          {errors.paymentMethod?.message ? (
            <p className="text-xs text-danger">
              {errors.paymentMethod.message}
            </p>
          ) : null}
        </FormSection>

        <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
          <Textarea
            id="comment"
            label="Коментар до замовлення"
            hint="Необов’язково, до 500 символів"
            maxLength={500}
            error={errors.comment?.message}
            {...register("comment", { validate: validateField("comment") })}
          />
        </section>

        <div className="grid gap-3">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            loadingLabel="Перевіряємо дані"
            className="w-full sm:w-fit sm:px-10"
          >
            Перевірити замовлення <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <p className="text-xs text-muted">
            На наступному кроці ви зможете перевірити все ще раз. Оплата — лише
            після підтвердження.
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
