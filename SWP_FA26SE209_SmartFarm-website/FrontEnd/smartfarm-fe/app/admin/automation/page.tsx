import type { Metadata } from "next";
import { AutomationPage } from "@/components/automation/automation-page";
import { DevicesProvider } from "@/components/devices/devices-provider";

export const metadata: Metadata = {
  title: "Điều khiển tự động | SmartFarm",
  description: "Quản lý quy tắc tưới, chiếu sáng và thông gió.",
};

export default function Page() {
  return (
    <DevicesProvider>
      <AutomationPage />
    </DevicesProvider>
  );
}
