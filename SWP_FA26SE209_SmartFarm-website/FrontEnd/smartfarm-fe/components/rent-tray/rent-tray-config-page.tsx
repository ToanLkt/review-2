import { Breadcrumb } from "@/components/user/user-ui";
import { RentalConfigurator } from "./rental-configurator";

export function RentTrayConfigPage({ seedId }: { seedId: string }) {
  return <div className="pt-10"><div className="mx-auto max-w-7xl px-6"><Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Thuê khay", href: "/rent-tray" }, { label: "Chọn khay và giống" }]} /><h1 className="text-3xl font-bold">Chọn khay và giống rau</h1><p className="mt-2 text-sm text-[#6b7280]">Chọn thông tin phù hợp cho khay bạn muốn thuê.</p></div><RentalConfigurator compact initialSeedId={seedId} /></div>;
}
