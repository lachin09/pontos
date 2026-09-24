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
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingContactButton />
    </>
  );
}
