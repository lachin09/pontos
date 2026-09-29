import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getStoreInfo } from "@/lib/data/storefront";
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
