import { Suspense } from "react";
import { UsersPage } from "@/components/admin-users/users-page";
import Loading from "./loading";
export const metadata = {
  title: "Người dùng & phân quyền | SmartFarm",
  description: "Quản lý tài khoản khách hàng, nhân viên và ma trận phân quyền.",
};
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <UsersPage />
    </Suspense>
  );
}
