"use client";

import { Button } from "@/components/ui/button";

export default function StorefrontError({
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
        <h1 className="mt-3 text-3xl">Не вдалося завантажити сторінку</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Оновіть сторінку або спробуйте ще раз трохи пізніше.
        </p>
        <Button className="mt-6" type="button" onClick={reset}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  );
}
