import { Skeleton } from "@/components/ui/skeleton";

export default function InfoPageLoading() {
  return (
    <div
      className="mx-auto max-w-3xl px-page py-10 sm:py-16"
      aria-label="Завантаження сторінки"
    >
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 h-11 w-2/3" />
      <div className="mt-10 grid gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
