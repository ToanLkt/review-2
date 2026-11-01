import { Suspense } from "react";
import { StaffCultivation } from "@/components/staff/staff-cultivation";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sản phẩm và giá | SmartFarm",
  description: "Quản lý vật tư, giá bán và giá thuê khay theo chu kỳ.",
};

function Loading() {
  return (
    <main className="w-full min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-[1800px] space-y-7 px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
      <main className="w-full min-w-0 flex-1 bg-[#F7FAF8] px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1800px]"><StaffCultivation /></div></main>
    </Suspense>
  );
}
