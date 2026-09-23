import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1440px] place-items-center px-page py-16 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          404
        </p>
        <h1 className="mt-3 text-2xl font-medium">Товар не знайдено</h1>
        <p className="mt-2 text-sm text-muted">
          Можливо, його вже немає в колекції.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          Перейти до каталогу
        </Link>
      </div>
    </div>
  );
}
