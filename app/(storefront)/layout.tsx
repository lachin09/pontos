import type { ReactNode } from "react";
import { CartHydration } from "@/components/cart/cart-hydration";
import { FloatingContactButton } from "@/components/layout/floating-contact-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CartHydration />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[var(--radius-control)] focus:bg-foreground focus:px-4 focus:py-3 focus:text-sm focus:text-background"
      >
        Перейти до вмісту
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <FloatingContactButton />
    </>
  );
}
