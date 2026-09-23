import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/constants/order";

const requiredName = (label: string) =>
  z.string().trim().min(2, `${label}: введіть щонайменше 2 символи`).max(80);

export const checkoutSchema = z.object({
  firstName: requiredName("Ім’я"),
  lastName: requiredName("Прізвище"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+380\d{9}|0\d{9})$/,
      "Введіть коректний номер телефону України",
    ),
  city: z.string().trim().min(2, "Вкажіть місто").max(100),
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
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
