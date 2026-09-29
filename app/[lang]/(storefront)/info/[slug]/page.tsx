import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { SellerDetails } from "@/components/content/seller-details";
import { getStoreInfo } from "@/lib/data/storefront";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { isInfoPageSlug } from "@/lib/validators/store-info";

async function loadPage(slug: string) {
  if (!isInfoPageSlug(slug)) return null;
  const { t } = await getI18n();
  const info = await getStoreInfo().catch(() => null);
  const body = info?.pages[slug].trim();
  // Unwritten pages stay hidden rather than showing an empty screen.
  if (!info || !body) return null;
  return { title: t.info.pages[slug], body, seller: info.seller, slug };
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getI18n();
  const page = await loadPage(slug);
  return page
    ? { title: page.title, alternates: languageAlternates(`/info/${slug}`) }
    : { title: t.notFound.title };
}

export default async function InfoPage({
  params,
}: PageProps<"/[lang]/info/[slug]">) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();
  const { t, locale } = await getI18n();

  return (
    <article className="mx-auto max-w-3xl px-page py-10 sm:py-16">
      <p className="eyebrow">{t.info.eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{page.title}</h1>
      {locale !== "uk" ? (
        <p className="mt-4 text-sm text-muted">{t.info.ukrainianOnly}</p>
      ) : null}
      <div className="mt-8 sm:mt-10" lang="uk">
        <RichText source={page.body} />
      </div>
      {page.slug === "about" || page.slug === "offer" ? (
        <section className="mt-12" aria-labelledby="seller-heading">
          <h2 id="seller-heading" className="mb-4 text-2xl">
            {t.info.seller}
          </h2>
          <SellerDetails seller={page.seller} locale={locale} />
        </section>
      ) : null}
    </article>
  );
}
