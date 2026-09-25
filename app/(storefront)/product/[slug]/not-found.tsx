import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1440px] place-items-center px-page py-16 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl">Товар не знайдено</h1>
        <p className="mt-2 text-sm text-muted">
          Можливо, його вже немає в колекції.
        </p>
        <Link
          href="/catalog"
          className={buttonClasses({ size: "lg", className: "mt-7" })}
        >
          Перейти до каталогу
        </Link>
      </div>
    </div>
  );
}
