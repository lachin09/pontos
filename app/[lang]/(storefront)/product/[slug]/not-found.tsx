import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export default async function ProductNotFound() {
  const { t, href } = await getI18n();
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1440px] place-items-center px-page py-16 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl">{t.product.notFoundTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.product.notFoundText}</p>
        <Link
          href={href("/catalog")}
          className={buttonClasses({ size: "lg", className: "mt-7" })}
        >
          {t.product.toCatalog}
        </Link>
      </div>
    </div>
  );
}
