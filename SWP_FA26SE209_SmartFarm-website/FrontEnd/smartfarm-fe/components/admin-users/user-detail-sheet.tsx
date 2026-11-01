"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { UserResponse } from "@/lib/api/types";
import { apiRoleLabels } from "@/lib/users";
import { dateTime } from "@/lib/formatters";

export function UserDetailSheet({ user, onClose, onEdit }: { user: UserResponse; onClose: () => void; onEdit: () => void }) {
  const fields = [
    ["Email", user.email], ["Họ và tên", user.fullName],
    ["Số điện thoại", user.phone || "—"], ["Địa chỉ", user.address || "—"], ["Mã vai trò", user.role?.toUpperCase() ?? "—"], ["Vai trò", apiRoleLabels[user.role?.toUpperCase() ?? ""] ?? user.role],
    ["Tài khoản", user.isActive ? "Hoạt động" : "Đã khóa"],
    ["Email xác nhận", user.emailConfirmed ? "Đã xác nhận" : "Chưa xác nhận"],
    ["Ngày tạo", dateTime(user.createdAt)],
    ["Cập nhật cuối", user.updatedAt ? dateTime(user.updatedAt) : "—"],
  ];
  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent className="overflow-y-auto sm:max-w-[520px]">
      <SheetHeader><SheetTitle>Chi tiết người dùng</SheetTitle><SheetDescription>Thông tin tài khoản lấy từ hệ thống.</SheetDescription></SheetHeader>
      <dl className="space-y-4 px-4 py-5">{fields.map(([label, value]) => <div key={label} className="border-b pb-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>
      <SheetFooter className="px-4"><Button variant="outline" onClick={onClose}>Đóng</Button><Button onClick={onEdit}>Chỉnh sửa</Button></SheetFooter>
    </SheetContent>
  </Sheet>;
}
