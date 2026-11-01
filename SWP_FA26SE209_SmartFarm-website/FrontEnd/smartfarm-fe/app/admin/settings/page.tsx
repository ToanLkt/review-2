import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Cài đặt | SmartFarm",
  description: "Quản lý thông tin nông trại và tùy chọn hệ thống.",
};

export default function Page() {
  return <SettingsPage />;
}
