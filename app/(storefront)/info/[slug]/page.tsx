import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { SellerDetails } from "@/components/content/seller-details";
import { getStoreInfo } from "@/lib/data/storefront";
import { INFO_PAGES, isInfoPageSlug } from "@/lib/validators/store-info";

async function loadPage(slug: string) {
  if (!isInfoPageSlug(slug)) return null;
  const info = await getStoreInfo().catch(() => null);
  const body = info?.pages[slug].trim();
  // Unwritten pages stay hidden rather than showing an empty screen.
  if (!info || !body) return null;
  return { title: INFO_PAGES[slug].title, body, seller: info.seller, slug };
}

export async function generateMetadata({
  params,
}: PageProps<"/info/[slug]">): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  return page ? { title: page.title } : { title: "Сторінку не знайдено" };
}

export default async function InfoPage({ params }: PageProps<"/info/[slug]">) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-page py-10 sm:py-16">
      <p className="eyebrow">PONTOS · інформація</p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{page.title}</h1>
      <div className="mt-8 sm:mt-10">
        <RichText source={page.body} />
      </div>
      {page.slug === "about" || page.slug === "offer" ? (
        <section className="mt-12" aria-labelledby="seller-heading">
          <h2 id="seller-heading" className="mb-4 text-2xl">
            Інформація про продавця
          </h2>
          <SellerDetails seller={page.seller} />
        </section>
      ) : null}
    </article>
  );
}
