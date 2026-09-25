import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getStoreInfo } from "@/lib/data/storefront";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  description: "Вкажіть контактні дані, доставку та спосіб оплати.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const info = await getStoreInfo().catch(() => null);
  return (
    <CheckoutPage
      policyLinks={{
        offer: Boolean(info?.pages.offer.trim()),
        privacy: Boolean(info?.pages.privacy.trim()),
      }}
    />
  );
}
