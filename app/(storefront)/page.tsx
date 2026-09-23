import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import { createCategoryService } from "@/services/category.service";
import { createProductService } from "@/services/product.service";
import { createSupabaseCategoryRepository } from "@/repositories/supabase/category.repository";
import { createSupabaseProductRepository } from "@/repositories/supabase/product.repository";

const productService = createProductService(createSupabaseProductRepository());
const categoryService = createCategoryService(
  createSupabaseCategoryRepository(),
);

export default async function HomePage() {
  await connection();
  const [products, categories] = await Promise.all([
    productService.listProducts(),
    categoryService.listActiveCategories(),
  ]);
  const featuredProducts = products
    .filter((product) => product.isFeatured)
    .slice(0, 4);
  const newProducts = products.filter((product) => product.isNew).slice(0, 4);
  const saleProduct = products.find((product) => product.isSale);
  const heroProduct =
    products.find((product) => product.slug === "weekend-sweatshirt") ??
    products[0];
  const heroImage = heroProduct?.images[0];
  const fallbackHeroImage =
    "https://images.unsplash.com/photo-1483985988355-763728e1935b";

  return (
    <>
      <section className="mx-auto grid max-w-[1600px] overflow-hidden bg-[#e9e7de] md:min-h-[min(720px,calc(100vh-6rem))] md:grid-cols-[0.82fr_1.18fr]">
        <div className="relative z-10 flex flex-col justify-center px-page py-14 sm:py-20 md:py-24 lg:pl-[max(5vw,calc((100vw-1440px)/2))]">
          <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent">
            PONTOS <span className="h-px w-8 bg-accent/45" /> Нова колекція
          </p>
          <h1 className="mt-6 max-w-xl text-[2.65rem] font-normal leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.5rem]">
            Щодня —<br />
            <span className="text-accent">у своєму.</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted sm:text-base">
            Одяг, який легко обрати зранку й хочеться носити знову. Продумані
            силуети, приємні тканини та кольори, що поєднуються між собою.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/catalog"
              className="inline-flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              Знайти свою річ <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href={featuredProducts.length > 0 ? "#featured" : "/catalog"}
              className="text-sm font-medium text-foreground hover:text-accent"
            >
              {featuredProducts.length > 0 ? "Рекомендовані" : "До каталогу"}{" "}
              <ArrowDown className="ml-1 inline" size={14} aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-9 flex items-center gap-2 text-xs text-muted">
            <ShieldCheck size={15} className="text-accent" aria-hidden="true" />
            Оформлення без реєстрації
          </p>
        </div>
        <div className="relative min-h-[420px] bg-surface-muted sm:min-h-[560px] md:min-h-[620px]">
          <Image
            src={heroImage?.url ?? fallbackHeroImage}
            alt={heroImage ? heroImage.alt || heroProduct?.name || "" : ""}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 65vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-5 pt-20 text-white sm:p-8 sm:pt-28">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/75">
                {heroProduct ? "Обрана модель" : "PONTOS · everyday essentials"}
              </p>
              <p className="mt-1 text-xl font-medium">
                {heroProduct?.name ?? "Гардероб на кожен день"}
              </p>
              {heroProduct ? (
                <p className="mt-1 text-sm text-white/80">
                  {formatPrice(heroProduct.price)}
                </p>
              ) : null}
            </div>
            <Link
              href={heroProduct ? `/product/${heroProduct.slug}` : "/catalog"}
              aria-label={
                heroProduct
                  ? `Переглянути ${heroProduct.name}`
                  : "Перейти до каталогу"
              }
              className="grid size-12 shrink-0 place-items-center rounded-full border border-white/60 bg-white/10 backdrop-blur transition-colors hover:bg-white hover:text-foreground"
            >
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-label="Переваги замовлення"
        className="border-b border-border bg-surface"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-border px-page sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <PackageCheck
              size={18}
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-xs font-medium sm:text-sm">
              Доставка по Україні
            </span>
          </div>
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5 sm:px-4">
            <WalletCards
              size={18}
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-xs font-medium sm:text-sm">
              Оплата при отриманні або переказом
            </span>
          </div>
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <ShieldCheck
              size={18}
              className="shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="text-xs font-medium sm:text-sm">
              Без створення акаунта
            </span>
          </div>
        </div>
      </section>

      <section
        id="categories"
        className="scroll-mt-24 border-b border-border bg-surface"
      >
        <div className="mx-auto max-w-[1440px] px-page py-16 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Знайдіть своє
              </p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                Категорії
              </h2>
            </div>
            <Link
              href="/catalog"
              className="hidden items-center gap-2 text-sm font-medium text-accent sm:inline-flex"
            >
              Дивитись усе <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.slug}`}
                className="group relative aspect-[0.88] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted"
              >
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 18vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                  />
                ) : null}
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-sm font-medium text-white sm:p-4 sm:text-base">
                  {category.name}
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 opacity-80"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section id="featured" className="scroll-mt-24">
          <div className="mx-auto max-w-[1440px] px-page py-16 sm:py-20">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
                  Вибір команди
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                  Улюблене
                </h2>
              </div>
              <Link
                href="#new-in"
                className="inline-flex items-center gap-2 text-xs font-medium text-accent sm:text-sm"
              >
                Дивитись новинки <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {saleProduct ? (
        <section className="bg-[#e9e7de]">
          <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-page py-14 sm:py-20 md:grid-cols-2 md:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface-muted">
              {saleProduct.images[0] ? (
                <Image
                  src={saleProduct.images[0].url}
                  alt={saleProduct.images[0].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : null}
              <Badge variant="sale" className="absolute left-4 top-4">
                Спеціальна ціна
              </Badge>
            </div>
            <div className="py-2 md:py-8">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Особлива пропозиція
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
                Менше речей. Більше можливостей.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                {saleProduct.description}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <span className="text-lg font-medium">
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
                className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                Обрати свою річ <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {newProducts.length > 0 ? (
        <section id="new-in" className="scroll-mt-24 bg-surface">
          <div className="mx-auto max-w-[1440px] px-page py-16 sm:py-20">
            <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
                  Щойно додали
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                  Новинки
                </h2>
              </div>
              <span className="text-xs text-muted">Оновлення колекції</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {products.length === 0 ? (
        <section className="border-y border-border bg-surface px-page py-14 text-center sm:py-20">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
            Колекція PONTOS
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-3xl sm:text-4xl">
            Готуємо перші речі для вас
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            У каталозі поки немає опублікованих товарів. Завітайте трохи згодом.
          </p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-accent px-5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Перейти до каталогу <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section id="about" className="scroll-mt-24">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-page py-16 sm:py-24 md:grid-cols-[0.7fr_1.3fr] md:gap-20">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent">
              Наш підхід
            </p>
            <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Менше шуму. Більше улюблених речей.
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-base leading-8 text-muted sm:text-lg">
              Ми збираємо гардероб навколо простих форм, приємних матеріалів і
              кольорів, які легко поєднувати. Без зайвого — лише речі, що
              пасують саме вашому ритму.
            </p>
            <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold">Продумані форми</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Зручний крій і деталі для щоденного носіння.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Легко поєднувати</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Спокійна палітра та речі, що доповнюють одна одну.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Носити знову</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Базові силуети, що залишаються актуальними.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="delivery"
        className="scroll-mt-24 border-y border-border bg-surface"
      >
        <div className="mx-auto grid max-w-[1440px] gap-8 px-page py-12 sm:grid-cols-3 sm:gap-10 sm:py-16">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
              <PackageCheck size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Зручна доставка</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Нова пошта, Укрпошта або кур’єрська доставка.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
              <WalletCards size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Зручна оплата</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Переказ на рахунок або оплата при отриманні.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
              <RotateCcw size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Потрібна допомога?</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Напишіть нам — підкажемо з розміром та замовленням.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-page py-16 text-center sm:py-24">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
          PONTOS · everyday essentials
        </p>
        <h2 className="mx-auto mt-4 max-w-xl text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Гардероб, у якому легко бути собою.
        </h2>
        <Link
          href="#categories"
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover"
        >
          Переглянути всю колекцію <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
