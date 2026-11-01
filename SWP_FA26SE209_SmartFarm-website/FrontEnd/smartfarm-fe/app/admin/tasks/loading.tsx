import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      aria-label="Đang tải lịch công việc"
      className="space-y-7 bg-white p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Skeleton className="h-[720px] rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    </main>
  );
}
