import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { UserRole, UserStatus } from "@/lib/users";
export function RoleBadge({ role }: { role: UserRole }) {
  const style =
    role === "Quản trị viên"
      ? "bg-violet-50 text-violet-700"
      : role === "Nhân viên"
        ? "bg-blue-50 text-blue-700"
        : "bg-slate-100 text-slate-700";
  return (
    <Badge
      variant="outline"
      className={style + " border-transparent text-[11px] font-medium"}
    >
      {role}
    </Badge>
  );
}
export function UserStatusBadge({ status }: { status: UserStatus }) {
  const style =
    status === "Hoạt động"
      ? "bg-green-50 text-green-700"
      : status === "Đã khóa"
        ? "bg-red-50 text-red-600"
        : "bg-amber-50 text-amber-700";
  return (
    <Badge
      variant="outline"
      className={style + " border-transparent text-[11px] font-medium"}
    >
      {status}
    </Badge>
  );
}
export function UserAvatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white " +
        color
      }
    >
      {name.trim().charAt(0).toLocaleUpperCase("vi-VN")}
    </span>
  );
}
export function UserCard({ children }: { children: ReactNode }) {
  return (
    <article className="space-y-4 rounded-2xl border bg-white p-4 shadow-[0_1px_3px_#244a3008]">
      {children}
    </article>
  );
}
