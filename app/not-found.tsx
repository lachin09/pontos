import type { Metadata } from "next";
import { CartHydration } from "@/components/cart/cart-hydration";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Сторінку не знайдено",
  robots: { index: false, follow: false },
};

/** 404 for URLs that match no route; adds the store header and footer. */
export default function NotFound() {
  return (
    <>
      <CartHydration />
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
