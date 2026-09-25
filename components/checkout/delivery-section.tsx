"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormSection } from "@/components/checkout/form-section";
import { validateField } from "@/components/checkout/field-validation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DELIVERY_COUNTRIES } from "@/lib/constants/countries";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/lib/constants/order";
import { DELIVERY_METHOD_LABELS } from "@/lib/constants/order-labels";
import type { CheckoutData } from "@/lib/validators/checkout";

const countryOptions = DELIVERY_COUNTRIES.map(({ code, name }) => ({
  value: code,
  label: name,
}));

/** What to type in the address field for each carrier. */
const ADDRESS_FIELD: Record<DeliveryMethod, { label: string; hint: string }> = {
  nova_poshta: {
    label: "Відділення, поштомат або адреса",
    hint: "Наприклад: Відділення №12 або вул. Хрещатик, 1, кв. 5",
  },
  ukrposhta: {
    label: "Відділення або адреса",
    hint: "Наприклад: Відділення 01001 або вул. Хрещатик, 1, кв. 5",
  },
  courier: {
    label: "Адреса доставки",
    hint: "Вулиця, будинок, квартира, під’їзд",
  },
};

export function DeliverySection() {
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
  const addressField =
    ADDRESS_FIELD[deliveryMethod] ?? ADDRESS_FIELD.nova_poshta;

  return (
    <FormSection id="delivery-heading" step={2} title="Доставка">
      <Select
        id="deliveryCountryCode"
        label="Країна доставки"
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
        label="Спосіб доставки"
        options={(isInternational
          ? (["nova_poshta"] as const)
          : DELIVERY_METHODS
        ).map((value) => ({ value, label: DELIVERY_METHOD_LABELS[value] }))}
        error={errors.deliveryMethod?.message}
        {...register("deliveryMethod", {
          validate: validateField("deliveryMethod"),
        })}
      />
      <Input
        id="city"
        label="Місто"
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register("city", { validate: validateField("city") })}
      />
      {isInternational ? (
        <Input
          id="deliveryPostalCode"
          label="Поштовий індекс"
          autoComplete="postal-code"
          error={errors.deliveryPostalCode?.message}
          {...register("deliveryPostalCode", {
            validate: validateField("deliveryPostalCode"),
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
            validate: validateField("deliveryAddress"),
          })}
        />
      </div>
      {isInternational ? (
        <p className="text-xs text-muted sm:col-span-2">
          Для міжнародних адрес ми перевіримо доступність маршруту та вартість
          доставки після отримання замовлення.
        </p>
      ) : null}
    </FormSection>
  );
}
