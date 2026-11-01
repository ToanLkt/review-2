import { Suspense } from "react";
import { StaffFarmInfrastructure } from "@/components/staff/staff-farm-infrastructure";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <main className="mx-auto min-h-[calc(100dvh-80px)] w-full max-w-[1700px] bg-white p-4 sm:p-6 lg:p-8"><StaffFarmInfrastructure /></main>
    </Suspense>
  );
}
