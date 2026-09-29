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
import { PAYMENT_METHODS } from "@/lib/constants/order";
import { useI18n } from "@/lib/i18n/client";
import {
  checkoutSchemaFor,
  type CheckoutData,
} from "@/lib/validators/checkout";

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

/** Collects contact, delivery and payment details; calls onValid with clean data. */
export function CheckoutForm({
  initialData,
  onValid,
}: {
  initialData: CheckoutData | null;
  onValid: (data: CheckoutData) => void;
}) {
  const { t, locale } = useI18n();
  const c = t.checkout;
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
    const result = checkoutSchemaFor(locale).safeParse(data);
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
        <FormSection id="customer-heading" step={1} title={c.contact}>
          <Input
            id="firstName"
            label={c.firstName}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName", {
              validate: validateField("firstName", locale),
            })}
          />
          <Input
            id="lastName"
            label={c.lastName}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName", {
              validate: validateField("lastName", locale),
            })}
          />
          <Input
            id="phone"
            label={c.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+380…"
            error={errors.phone?.message}
            {...register("phone", { validate: validateField("phone", locale) })}
          />
        </FormSection>

        <DeliverySection />

        <FormSection id="payment-heading" step={3} title={c.payment} asFieldset>
          {PAYMENT_METHODS.map((value) => (
            <Radio
              key={value}
              id={`payment-${value}`}
              value={value}
              label={c.paymentMethods[value]}
              description={c.paymentDescriptions[value]}
              {...register("paymentMethod", {
                validate: validateField("paymentMethod", locale),
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
            label={c.comment}
            hint={c.commentHint}
            maxLength={500}
            error={errors.comment?.message}
            {...register("comment", {
              validate: validateField("comment", locale),
            })}
          />
        </section>

        <div className="grid gap-3">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            loadingLabel={c.checking}
            className="w-full sm:w-fit sm:px-10"
          >
            {c.review} <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <p className="text-xs text-muted">{c.reviewNote}</p>
        </div>
      </form>
    </FormProvider>
  );
}
