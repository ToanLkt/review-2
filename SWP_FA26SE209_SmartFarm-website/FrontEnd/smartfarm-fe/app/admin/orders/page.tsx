import { Suspense } from "react";
import { StaffOrders } from "@/components/staff/staff-orders";
import Loading from "./loading";
export const metadata = {
  title: "Đơn hàng | SmartFarm",
  description: "Theo dõi và xử lý đơn thuê khay và đơn mua hạt giống.",
};
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <main className="w-full min-w-0 flex-1 bg-[#F7FAF8] px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1800px]"><StaffOrders basePath="/admin/orders" /></div></main>
    </Suspense>
  );
}
