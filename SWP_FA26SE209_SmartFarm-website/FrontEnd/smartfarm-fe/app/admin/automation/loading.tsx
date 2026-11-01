import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div
      aria-label="Đang tải quy tắc tự động"
      className="space-y-6 bg-white p-8"
    >
      <Skeleton className="h-16" />
      <Skeleton className="h-28" />
      {[1, 2, 3].map((id) => (
        <Skeleton key={id} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}
