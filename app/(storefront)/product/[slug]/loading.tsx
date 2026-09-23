import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div
      className="mx-auto max-w-[1440px] px-page pb-16 pt-8 sm:pb-24 sm:pt-10"
      aria-label="Завантаження товару"
    >
      <Skeleton className="h-4 w-32" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="grid content-start gap-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-5 h-px w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mt-6 h-12 w-48" />
        </div>
      </div>
    </div>
  );
}
