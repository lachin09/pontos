import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getFirstCustomerDiscount, getStoreInfo } from "@/lib/data/storefront";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.checkout.metaTitle,
    description: t.checkout.metaDescription,
    robots: { index: false, follow: false },
  };
}

export default async function Page() {
  const [info, discountPercent] = await Promise.all([
    getStoreInfo().catch(() => null),
    getFirstCustomerDiscount().catch(() => 0),
  ]);
  return (
    <CheckoutPage
      discountPercent={discountPercent}
      policyLinks={{
        offer: Boolean(info?.pages.offer.trim()),
        privacy: Boolean(info?.pages.privacy.trim()),
      }}
    />
  );
}
