"use client";

import { Button } from "@/components/ui/button";

export default function CatalogError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[1440px] place-items-center px-page py-16 text-center">
      <div>
        <h1 className="text-2xl font-medium">Не вдалося завантажити каталог</h1>
        <p className="mt-2 text-sm text-muted">
          Оновіть сторінку або спробуйте ще раз.
        </p>
        <Button type="button" className="mt-6" onClick={retry}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  );
}
