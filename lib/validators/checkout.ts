import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/constants/order";
import { DELIVERY_COUNTRIES } from "@/lib/constants/countries";

const requiredName = (label: string) =>
  z.string().trim().min(2, `${label}: введіть щонайменше 2 символи`).max(80);

export const checkoutSchema = z
  .object({
    firstName: requiredName("Ім’я"),
    lastName: requiredName("Прізвище"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(?:\+[1-9]\d{6,14}|0\d{9})$/,
        "Введіть коректний номер телефону з кодом країни",
      ),
    city: z.string().trim().min(2, "Вкажіть місто").max(100),
    deliveryCountryCode: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .refine(
        (code) => DELIVERY_COUNTRIES.some((country) => country.code === code),
        "Оберіть країну доставки",
      ),
    deliveryPostalCode: z
      .string()
      .trim()
      .max(30, "Індекс має містити до 30 символів"),
    deliveryMethod: z.enum(DELIVERY_METHODS, {
      error: "Оберіть спосіб доставки",
    }),
    deliveryAddress: z
      .string()
      .trim()
      .min(2, "Вкажіть відділення або адресу")
      .max(200),
    paymentMethod: z.enum(PAYMENT_METHODS, { error: "Оберіть спосіб оплати" }),
    comment: z.string().trim().max(500, "Коментар має містити до 500 символів"),
  })
  .superRefine((data, context) => {
    if (
      data.deliveryCountryCode !== "UA" &&
      data.deliveryMethod !== "nova_poshta"
    ) {
      context.addIssue({
        code: "custom",
        path: ["deliveryMethod"],
        message: "Для міжнародної доставки оберіть Нову пошту",
      });
    }
    if (
      data.deliveryCountryCode !== "UA" &&
      data.deliveryPostalCode.length < 3
    ) {
      context.addIssue({
        code: "custom",
        path: ["deliveryPostalCode"],
        message: "Вкажіть поштовий індекс",
      });
    }
  });

export type CheckoutData = z.infer<typeof checkoutSchema>;
