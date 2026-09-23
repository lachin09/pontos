import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  description: "Вкажіть контактні дані, доставку та спосіб оплати.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutPage />;
}
