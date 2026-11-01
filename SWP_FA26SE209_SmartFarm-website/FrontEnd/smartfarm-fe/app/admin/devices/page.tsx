import { Suspense } from "react";
import type { Metadata } from "next";
import { StaffIoT } from "@/components/staff/staff-iot";
import { Skeleton } from "@/components/ui/skeleton";
export const metadata: Metadata = {
  title: "Thiết bị IoT | SmartFarm",
  description:
    "Theo dõi trạng thái và điều khiển thiết bị.",
};
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 bg-white p-8" aria-label="Đang tải thiết bị">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <main className="w-full min-w-0 flex-1 bg-[#F7FAF8] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1800px]"><StaffIoT /></div>
      </main>
    </Suspense>
  );
}
