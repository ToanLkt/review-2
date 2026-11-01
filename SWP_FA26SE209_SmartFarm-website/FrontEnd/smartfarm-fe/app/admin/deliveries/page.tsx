import { StaffDeliveries } from "@/components/staff/staff-deliveries";

export const metadata = { title: "Giao hàng | SmartFarm" };

export default function Page() {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1700px]"><StaffDeliveries basePath="/admin/deliveries" /></div></main>;
}
