import type { Metadata } from "next";
import { AlertsPage } from "@/components/alerts/alerts-page";

export const metadata: Metadata = {
  title: "Cảnh báo | SmartFarm",
  description: "Theo dõi sự cố và các điều kiện cần được xử lý.",
};

export default function Page() {
  return <AlertsPage />;
}
