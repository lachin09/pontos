"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export default function CatalogError({ retry }: { retry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1440px] place-items-center px-page py-16 text-center">
      <div>
        <h1 className="text-2xl font-medium">{t.catalog.errorTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.catalog.errorText}</p>
        <Button type="button" className="mt-6" onClick={retry}>
          {t.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}
