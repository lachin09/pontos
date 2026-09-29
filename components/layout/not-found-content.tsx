import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { i18nFor } from "@/lib/i18n/translator";

export function NotFoundContent({ locale }: { locale: Locale }) {
  const { t, href } = i18nFor(locale);
  return (
    <div className="grid min-h-[55vh] place-items-center px-page py-20 text-center">
      <div className="max-w-md">
        <p className="eyebrow">{t.notFound.eyebrow}</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          {t.notFound.title}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">{t.notFound.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            href={href("/catalog")}
            className={buttonClasses({ size: "lg" })}
          >
            {t.common.toCatalog} <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={href("/")}
            className={buttonClasses({ variant: "ghost", size: "lg" })}
          >
            {t.common.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
