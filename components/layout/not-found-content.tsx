import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <div className="grid min-h-[55vh] place-items-center px-page py-20 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Помилка 404</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          Сторінку не знайдено
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Можливо, посилання застаріло або сторінку перенесли. Спробуйте почати
          з каталогу.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/catalog" className={buttonClasses({ size: "lg" })}>
            До каталогу <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href="/"
            className={buttonClasses({ variant: "ghost", size: "lg" })}
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
