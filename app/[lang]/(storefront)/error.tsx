"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function StorefrontError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-[55vh] place-items-center px-page py-16 text-center">
      <div className="max-w-md">
        <p className="eyebrow">PONTOS</p>
        <h1 className="mt-3 text-4xl">{t.error.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t.error.text}</p>
        <Button className="mt-7" size="lg" type="button" onClick={reset}>
          {t.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}
