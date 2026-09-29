"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, href } = useI18n();
  return (
    <div className="grid min-h-[55vh] place-items-center px-page py-16 text-center">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          PONTOS
        </p>
        <h1 className="mt-3 text-3xl">{t.product.errorTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t.product.errorText}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" onClick={reset}>
            {t.common.tryAgain}
          </Button>
          <Link
            href={href("/catalog")}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            {t.common.toCatalog}
          </Link>
        </div>
      </div>
    </div>
  );
}
