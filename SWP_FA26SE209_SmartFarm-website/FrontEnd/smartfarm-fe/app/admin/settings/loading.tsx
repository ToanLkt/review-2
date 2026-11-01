import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-[620px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
