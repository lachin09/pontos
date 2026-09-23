import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div
      className="mx-auto max-w-[1440px] px-page py-10 sm:py-14"
      aria-label="Завантаження каталогу"
    >
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-48" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        <Skeleton className="h-[430px] w-full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
