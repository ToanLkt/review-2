import { StaffProfile } from "@/components/staff/staff-profile";

export const metadata = {
  title: "Thông tin cá nhân | SmartFarm",
  description: "Quản lý hồ sơ và bảo mật tài khoản quản trị.",
};

export default function Page() {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1700px]"><StaffProfile role="admin" /></div></main>;
}
