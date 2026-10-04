import type { ReactNode } from "react";
import { CartHydration } from "@/components/cart/cart-hydration";
import { FloatingContactButton } from "@/components/layout/floating-contact-button";
import { PromoBar } from "@/components/layout/promo-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getI18n } from "@/lib/i18n/server";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = await getI18n();
  return (
    <>
      <CartHydration />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[var(--radius-control)] focus:bg-foreground focus:px-4 focus:py-3 focus:text-sm focus:text-background"
      >
        {t.common.skipToContent}
      </a>
      <SiteHeader />
      <PromoBar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <FloatingContactButton />
    </>
  );
}
