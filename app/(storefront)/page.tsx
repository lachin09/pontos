import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { ProductTabs } from "@/components/home/product-tabs";
import { contactIcons } from "@/components/layout/contact-icons";
import { resolveContactLinks } from "@/components/layout/floating-contact-button";
import { ProductCard } from "@/components/product/product-card";
import { ProductPhoto } from "@/components/product/product-photo";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { GENDERS } from "@/lib/catalog/gender";
import { categoryLinks } from "@/lib/catalog/navigation";
import {
  getActiveCategories,
  getContactLinks,
  getPublishedProducts,
  getStoreInfo,
} from "@/lib/data/storefront";
import { formatPrice, pluralize, telHref } from "@/lib/utils/format";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";
import type { Product } from "@/types/product";

const HERO_SLIDES = 5;

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={`mb-10 flex flex-wrap items-end gap-4 sm:mb-12 ${centered ? "justify-center text-center" : "justify-between"}`}
    >
      <div className={centered ? "mx-auto" : ""}>
        <p
          className={`eyebrow flex items-center gap-3 ${centered ? "justify-center" : ""}`}
        >
          <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          {eyebrow}
          {centered ? (
            <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
          ) : null}
        </p>
        <h2 className="mt-4 text-[2.25rem] leading-[1.05] sm:text-5xl">
          {title}
        </h2>
        {description ? (
          <p
            className={`mt-4 max-w-xl text-sm leading-7 text-muted ${centered ? "mx-auto" : ""}`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/** Up to `count` products with photos, preferring the featured ones. */
function heroProducts(products: Product[], count: number) {
  const withPhotos = products.filter((product) => product.images[0]);
  return [
    ...withPhotos.filter((product) => product.isFeatured),
    ...withPhotos.filter((product) => !product.isFeatured),
  ].slice(0, count);
}

export default async function HomePage() {
  const [products, categories, info, contactRecords] = await Promise.all([
    getPublishedProducts(),
    getActiveCategories(),
    getStoreInfo().catch(() => EMPTY_STORE_INFO),
    getContactLinks().catch(() => []),
  ]);
  const collections = categoryLinks(categories, products);
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);
  const newProducts = products.filter((p) => p.isNew).slice(0, 8);
  const saleProduct = products.find(
    (product) =>
      product.isSale && product.oldPrice && product.oldPrice > product.price,
  );
  const hero = heroProducts(products, HERO_SLIDES);
  const showroomImage = (featuredProducts[3] ?? products[0])?.images[0];
  const { seller } = info;
  const instagram = resolveContactLinks(contactRecords).find(
    (link) => link.kind === "instagram",
  );
  const InstagramIcon = contactIcons.instagram;

  const tabs = [
    newProducts.length > 0
      ? {
          id: "new",
          label: "Новинки",
          panel: <ProductGrid products={newProducts} />,
        }
      : null,
    featuredProducts.length > 0
      ? {
          id: "featured",
          label: "Рекомендуємо",
          panel: <ProductGrid products={featuredProducts} />,
        }
      : null,
  ].filter((tab) => tab !== null);

  const trustFacts = [
    { value: "Шкіра · Замша", label: "Натуральні матеріали" },
    { value: "Еко-хутро", label: "Шуби, коміри та пончо" },
    {
      value: "Київ",
      label: seller.workingHours ? `Шоурум · ${seller.workingHours}` : "Шоурум",
    },
    { value: "Доставка", label: "По Україні та за кордон" },
  ];

  return (
    <>
      <HeroSlider
        slides={hero.map((product) => ({
          id: product.id,
          imageUrl: product.images[0].url,
          name: product.name,
          price: formatPrice(product.price),
          href: `/product/${product.slug}`,
        }))}
      />

      <section
        aria-label="Про PONTOS"
        className="border-b border-border bg-surface-muted"
      >
        <ul className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4">
          {trustFacts.map((fact, index) => (
            <li
              key={fact.value}
              className={`px-4 py-6 text-center sm:py-8 ${index % 2 === 1 ? "border-l border-border" : ""} ${index >= 2 ? "border-t border-border lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}
            >
              <p className="font-serif text-2xl leading-tight sm:text-[1.7rem]">
                {fact.value}
              </p>
              <p className="mt-1.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted">
                {fact.label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {collections.length > 0 ? (
        <section id="categories" className="scroll-mt-24">
          <div className="mx-auto max-w-[1440px] px-page py-16 sm:py-24">
            <SectionHeading
              eyebrow="Колекції"
              title="Шкіра, замша, еко-хутро."
              description="Натуральна шкіра та замша, м'яке й тепле еко-хутро. Оберіть категорію."
            />
            <div
              className={`grid grid-cols-2 gap-3 sm:gap-4 ${collections.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
            >
              {collections.map((category) => (
                <Link
                  key={category.slug}
                  href={`/catalog?category=${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-surface-muted"
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 48vw, 32vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
                    {category.gender ? (
                      <span className="mb-1 block text-[0.6rem] uppercase tracking-[0.22em] text-gold">
                        {
                          GENDERS.find((line) => line.value === category.gender)
                            ?.label
                        }
                      </span>
                    ) : null}
                    <span className="block font-serif text-[1.6rem] leading-tight sm:text-[2rem]">
                      {category.gender ? category.shortName : category.name}
                    </span>
                    <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.2em] text-white/70">
                      {category.productCount}{" "}
                      {pluralize(category.productCount, [
                        "модель",
                        "моделі",
                        "моделей",
                      ])}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tabs.length > 0 ? (
        <section id="new-in" className="scroll-mt-24 bg-surface">
          <div className="mx-auto max-w-[1440px] px-page py-16 sm:py-24">
            <ProductTabs tabs={tabs} />
            <div className="mt-12 text-center">
              <Link
                href="/catalog"
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                Увесь каталог <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {saleProduct ? (
        <section className="bg-surface-muted">
          <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-page py-16 sm:py-24 md:grid-cols-2 md:gap-16">
            <Link
              href={`/product/${saleProduct.slug}`}
              tabIndex={-1}
              aria-hidden="true"
              className="group relative aspect-[4/5] overflow-hidden bg-surface"
            >
              {saleProduct.images[0] ? (
                <ProductPhoto
                  src={saleProduct.images[0].url}
                  alt={saleProduct.images[0].alt}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              ) : null}
              <Badge variant="sale" className="absolute left-4 top-4">
                Спеціальна ціна
              </Badge>
            </Link>
            <div>
              <SectionHeading
                eyebrow="Особлива пропозиція"
                title={saleProduct.name}
              />
              <div className="-mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-highlight tabular-nums">
                  {formatPrice(saleProduct.price)}
                </span>
                {saleProduct.oldPrice ? (
                  <span className="text-sm text-muted line-through">
                    {formatPrice(saleProduct.oldPrice)}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/product/${saleProduct.slug}`}
                className={buttonClasses({ size: "lg", className: "mt-8" })}
              >
                Переглянути модель <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {products.length === 0 ? (
        <section className="border-y border-border bg-surface px-page py-14 text-center sm:py-20">
          <p className="eyebrow">Колекція PONTOS</p>
          <h2 className="mx-auto mt-3 max-w-xl text-4xl">
            Готуємо нову колекцію
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            У каталозі поки немає опублікованих товарів. Завітайте трохи згодом.
          </p>
        </section>
      ) : null}

      <section id="about" className="scroll-mt-24 bg-ink text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-page py-16 sm:py-24 md:grid-cols-2 md:gap-20">
          {showroomImage ? (
            <div className="relative aspect-[4/5] overflow-hidden md:order-2">
              <Image
                src={showroomImage.url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
              Шоурум у Києві
            </p>
            <h2 className="mt-4 text-[2.5rem] leading-[1.05] sm:text-6xl">
              Приміряйте перед покупкою
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/65 sm:text-base">
              Шкіру й замшу варто побачити наживо. Приходьте до шоуруму на
              примірку або замовляйте з доставкою по Україні та за кордон —
              оплата при отриманні.
            </p>
            {seller.workingHours || seller.phone ? (
              <dl className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-2">
                {seller.workingHours ? (
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-white/45">
                      Графік
                    </dt>
                    <dd className="mt-1 text-white">{seller.workingHours}</dd>
                  </div>
                ) : null}
                {seller.phone ? (
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-white/45">
                      Телефон
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={telHref(seller.phone)}
                        className="text-white transition-colors hover:text-gold"
                      >
                        {seller.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {seller.phone ? (
              <a
                href={telHref(seller.phone)}
                className={buttonClasses({
                  size: "lg",
                  className:
                    "mt-8 bg-white text-ink hover:bg-gold hover:text-white",
                })}
              >
                <Phone size={16} aria-hidden="true" /> Записатися на примірку
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {instagram ? (
        <section className="border-b border-border">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center px-page py-16 text-center sm:py-20">
            <p className="eyebrow">Instagram</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">
              {instagram.detail?.startsWith("@") || !instagram.detail
                ? (instagram.detail ?? "PONTOS")
                : `@${instagram.detail.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "")}`}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Нові надходження та образи — першими в нашому Instagram.
            </p>
            <a
              href={instagram.href}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({
                variant: "outline",
                size: "lg",
                className: "mt-7",
              })}
            >
              <InstagramIcon size={16} aria-hidden="true" /> Підписатися
            </a>
          </div>
        </section>
      ) : null}
    </>
  );
}
