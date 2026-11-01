import { Suspense } from "react";
import { StaffNotifications } from "@/components/staff/staff-notifications";
import { TableSkeleton } from "@/components/ui/loading-state";

export const metadata = { title: "Thông báo | SmartFarm" };

export default function Page() {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1700px]"><Suspense fallback={<TableSkeleton rows={5} columns={5} />}><StaffNotifications /></Suspense></div></main>;
}
