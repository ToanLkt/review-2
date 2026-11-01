import { Suspense } from "react";
import { StaffInventory } from "@/components/staff/staff-inventory";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Kho vật tư | SmartFarm",
  description: "Theo dõi tồn kho và lịch sử sử dụng vật tư.",
};

function Loading() {
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <main className="w-full min-w-0 flex-1 bg-[#F7FAF8] px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1800px]"><StaffInventory /></div></main>
    </Suspense>
  );
}
