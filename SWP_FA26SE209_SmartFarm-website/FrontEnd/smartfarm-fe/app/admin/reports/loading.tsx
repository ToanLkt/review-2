import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-label="Đang tải báo cáo" className="space-y-7 bg-[#F7FAF8] p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="space-y-5 rounded-2xl border bg-white p-6">
        <Skeleton className="h-12 w-96 max-w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </main>
  );
}
