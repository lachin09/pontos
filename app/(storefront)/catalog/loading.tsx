import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div
      className="mx-auto max-w-[1440px] px-page py-8 sm:py-12"
      aria-label="Завантаження каталогу"
    >
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-11 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 flex gap-2 overflow-hidden sm:mt-8">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} rounded="full" className="h-10 w-24 shrink-0" />
        ))}
      </div>
      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <Skeleton className="hidden h-[520px] w-full lg:block" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-card)]" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
