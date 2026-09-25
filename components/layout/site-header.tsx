import Link from "next/link";
import { CartLink } from "@/components/cart/cart-link";
import { HeaderNav } from "@/components/layout/header-nav";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { getActiveCategories } from "@/lib/data/storefront";
import type { Category } from "@/types/category";

export async function SiteHeader() {
  let categories: Category[] = [];
  try {
    categories = await getActiveCategories();
  } catch {
    // The menu still works without category shortcuts.
  }

  return (
    <>
      <div className="bg-accent px-4 py-2 text-center text-[0.65rem] font-medium tracking-[0.08em] text-accent-foreground sm:text-xs">
        Доставка Україною та за кордон
        <span className="mx-2 text-white/50" aria-hidden="true">
          ·
        </span>
        Оплата при отриманні або переказом
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-5 px-page sm:h-[4.5rem]">
          <Link
            href="/"
            aria-label="PONTOS — на головну"
            className="shrink-0 text-[1.05rem] font-semibold tracking-[0.22em] text-foreground sm:text-xl"
          >
            PONTOS<span className="text-highlight">.</span>
          </Link>
          <HeaderNav />
          <div className="flex items-center gap-1">
            <CartLink />
            <MobileNavigation
              categories={categories.map(({ name, slug }) => ({ name, slug }))}
            />
          </div>
        </div>
      </header>
    </>
  );
}
