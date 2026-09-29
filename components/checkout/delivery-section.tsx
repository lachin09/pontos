"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormSection } from "@/components/checkout/form-section";
import { validateField } from "@/components/checkout/field-validation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { deliveryCountries } from "@/lib/constants/countries";
import { DELIVERY_METHODS } from "@/lib/constants/order";
import { useI18n } from "@/lib/i18n/client";
import type { CheckoutData } from "@/lib/validators/checkout";

export function DeliverySection() {
  const { t, locale } = useI18n();
  const c = t.checkout;
  const countryOptions = useMemo(
    () =>
      deliveryCountries(locale).map(({ code, name }) => ({
        value: code,
        label: name,
      })),
    [locale],
  );
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutData>();
  const [countryCode, deliveryMethod] = useWatch({
    control,
    name: ["deliveryCountryCode", "deliveryMethod"],
  });
  const isInternational = countryCode !== "UA";
  const addressField = c.address[deliveryMethod] ?? c.address.nova_poshta;

  return (
    <FormSection id="delivery-heading" step={2} title={c.delivery}>
      <Select
        id="deliveryCountryCode"
        label={c.country}
        options={countryOptions}
        {...register("deliveryCountryCode", {
          onChange: (event) => {
            // Only Nova Post ships abroad.
            if (event.target.value !== "UA") {
              setValue("deliveryMethod", "nova_poshta", {
                shouldValidate: true,
              });
            }
          },
        })}
      />
      <Select
        id="deliveryMethod"
        label={c.method}
        options={(isInternational
          ? (["nova_poshta"] as const)
          : DELIVERY_METHODS
        ).map((value) => ({ value, label: c.deliveryMethods[value] }))}
        error={errors.deliveryMethod?.message}
        {...register("deliveryMethod", {
          validate: validateField("deliveryMethod", locale),
        })}
      />
      <Input
        id="city"
        label={c.city}
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register("city", { validate: validateField("city", locale) })}
      />
      {isInternational ? (
        <Input
          id="deliveryPostalCode"
          label={c.postalCode}
          autoComplete="postal-code"
          error={errors.deliveryPostalCode?.message}
          {...register("deliveryPostalCode", {
            validate: validateField("deliveryPostalCode", locale),
          })}
        />
      ) : null}
      <div className="sm:col-span-2">
        <Input
          id="deliveryAddress"
          label={addressField.label}
          hint={addressField.hint}
          autoComplete="street-address"
          error={errors.deliveryAddress?.message}
          {...register("deliveryAddress", {
            validate: validateField("deliveryAddress", locale),
          })}
        />
      </div>
      {isInternational ? (
        <p className="text-xs text-muted sm:col-span-2">
          {c.internationalNote}
        </p>
      ) : null}
    </FormSection>
  );
}
