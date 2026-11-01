import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[560px] rounded-2xl" />
      </div>
    </main>
  );
}
