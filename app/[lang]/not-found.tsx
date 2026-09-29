import type { Metadata } from "next";
import { CartHydration } from "@/components/cart/cart-hydration";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.notFound.title, robots: { index: false, follow: false } };
}

/** 404 for URLs that match no route; adds the store header and footer. */
export default async function NotFound() {
  const { locale } = await getI18n();
  return (
    <>
      <CartHydration />
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent locale={locale} />
      </main>
      <SiteFooter />
    </>
  );
}
