import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductColorProvider } from "@/components/product/product-color-context";
import { createSupabaseProductRepository } from "@/repositories/supabase/product.repository";
import { createProductService } from "@/services/product.service";

const productService = createProductService(createSupabaseProductRepository());

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);

  if (!product) return { title: "Товар не знайдено" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) notFound();

  const allProducts = await productService.listProducts();
  const relatedProducts = allProducts
    .filter(
      (candidate) =>
        candidate.categoryId === product.categoryId &&
        candidate.id !== product.id,
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1440px] px-page pb-16 pt-6 sm:pb-24 sm:pt-10">
      <Link
        href="/catalog"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden="true" /> До каталогу
      </Link>

      <ProductColorProvider product={product}>
        <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="lg:sticky lg:top-28">
            <ProductPurchase product={product} />
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold">Опис</h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              {product.description}
            </p>
            <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Склад</dt>
                <dd className="mt-1 font-medium">{product.composition}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Догляд</dt>
                <dd className="mt-1 font-medium">{product.careInstructions}</dd>
              </div>
            </dl>
          </div>

            <div className="mt-6 border-t border-border pt-5">
              <h2 className="text-sm font-semibold">Доставка й оплата</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Доставка Новою поштою, Укрпоштою або кур’єром. Оплата переказом на
                рахунок або при отриманні.
              </p>
              <Link
                href="/#delivery"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
              >
                Детальніше <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </ProductColorProvider>

      {relatedProducts.length > 0 ? (
        <section className="mt-16 border-t border-border pt-12 sm:mt-24 sm:pt-16">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
                З тієї ж категорії
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight">
                Вам також сподобається
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-xs font-medium text-accent sm:text-sm"
            >
              Усі товари <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
