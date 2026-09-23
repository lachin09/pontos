import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Кошик",
  description: "Перегляньте товари у кошику PONTOS.",
};

export default function CartRoute() {
  return <CartPage />;
}
