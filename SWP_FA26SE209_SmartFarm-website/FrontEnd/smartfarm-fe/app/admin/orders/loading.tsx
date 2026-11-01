import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main aria-label="Đang tải đơn hàng" className="space-y-7 bg-white p-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-3/4" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4 rounded-2xl border p-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </main>
  );
}
