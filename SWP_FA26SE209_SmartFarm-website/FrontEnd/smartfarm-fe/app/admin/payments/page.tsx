import { StaffPayments } from "@/components/staff/staff-payments";

export const metadata = { title: "Thanh toán | SmartFarm" };

export default function Page() {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1700px]"><StaffPayments /></div></main>;
}
