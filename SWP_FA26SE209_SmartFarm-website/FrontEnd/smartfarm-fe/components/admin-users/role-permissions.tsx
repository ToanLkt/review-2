"use client";

import { apiRoleLabels } from "@/lib/users";
import { useUsers } from "./users-provider";

export function RolePermissions() {
  const { roles, loading, loadError } = useUsers();

  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-[#809E8A]">
              <th className="px-5 py-4">Mã vai trò</th>
              <th className="px-5 py-4">Vai trò</th>
              <th className="px-5 py-4 text-right">Số người dùng</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.roleId} className="border-b last:border-0">
                <td className="px-5 py-4">{role.name.toUpperCase()}</td>
                <td className="px-5 py-4 font-medium">{apiRoleLabels[role.name.toUpperCase()] ?? role.name}</td>
                <td className="px-5 py-4 text-right">{role.userCount.toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                  {loading ? "Đang tải vai trò..." : loadError ? "Không thể tải danh sách vai trò." : "Chưa có vai trò."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
