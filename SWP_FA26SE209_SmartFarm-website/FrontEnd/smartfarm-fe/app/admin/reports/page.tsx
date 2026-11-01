import type { Metadata } from "next";
import { ReportsPage } from "@/components/reports/reports-page";

export const metadata: Metadata = {
  title: "Báo cáo quản trị | SmartFarm",
  description:
    "Tổng hợp doanh thu, kết quả thu hoạch và tình hình tồn kho.",
};

export default function Page() {
  return <ReportsPage />;
}
