import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.cart.metaTitle,
    description: t.cart.metaDescription,
    alternates: languageAlternates("/cart"),
  };
}

export default function CartRoute() {
  return <CartPage />;
}
