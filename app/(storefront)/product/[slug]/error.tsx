"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[55vh] place-items-center px-page py-16 text-center">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          PONTOS · essentials
        </p>
        <h1 className="mt-3 text-3xl">Не вдалося завантажити товар</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Спробуйте ще раз або поверніться до каталогу.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={reset}>
            Спробувати ще раз
          </Button>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            До каталогу
          </Link>
        </div>
      </div>
    </div>
  );
}
