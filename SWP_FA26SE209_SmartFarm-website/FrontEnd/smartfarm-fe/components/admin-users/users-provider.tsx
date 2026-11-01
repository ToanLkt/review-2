"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { adminUsersService } from "@/lib/api/admin/admin-users-instance";
import type { AdminRole, AdminUserRole } from "@/lib/api/admin/admin-users-service";
import { ApiError } from "@/lib/api/client";
import type { UserResponse } from "@/lib/api/types";
import { apiRoleLabels, type SmartFarmUser, type UserDraft, type UserErrors, type UserRole } from "@/lib/users";

const roleToApi: Record<UserRole, AdminUserRole> = { "Quản trị viên": "ADMIN", "Nhân viên": "STAFF", "Khách hàng": "CUSTOMER" };
const colors = ["bg-[#4F8F68]", "bg-[#568BA6]", "bg-[#8A79B8]", "bg-[#B07C72]"];

function toUiUser(user: UserResponse): SmartFarmUser {
  return {
    id: String(user.userId), name: user.fullName ?? "Chưa cập nhật", email: user.email ?? "",
    phone: user.phone ?? "", address: user.address ?? "",
    role: apiRoleLabels[user.role?.toUpperCase() ?? ""] ?? "Khách hàng",
    status: !user.isActive ? "Đã khóa" : user.emailConfirmed ? "Hoạt động" : "Chờ kích hoạt",
    createdAt: user.createdAt,
    detail: user.address || (user.role?.toUpperCase() === "ADMIN" ? "Quản trị hệ thống" : "Chưa cập nhật địa chỉ"),
    color: colors[user.userId % colors.length],
  };
}

function apiFormError(error: unknown): UserErrors {
  if (!(error instanceof ApiError)) return { form: "Không thể kết nối máy chủ. Vui lòng thử lại." };
  const validation = error.response?.errors;
  if (validation && typeof validation === "object") {
    const result: UserErrors = {};
    for (const [key, value] of Object.entries(validation as Record<string, unknown>)) {
      const message = Array.isArray(value) ? String(value[0]) : String(value);
      const field = key.toLowerCase();
      if (field === "fullname") result.name = message;
      else if (field === "temporarypassword") result.password = message;
      else if (field === "phonenumber") result.phone = message;
      else if (field === "email") result.email = message;
      else if (field === "address") result.address = message;
      else if (field === "role") result.role = message;
      else result.form = message;
    }
    if (Object.keys(result).length) return result;
  }
  return { form: error.message || "Yêu cầu không thành công." };
}

function useUsersState() {
  const [users, setUsers] = useState<SmartFarmUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const [firstPage, availableRoles] = await Promise.all([
        adminUsersService.list({ page: 1, pageSize: 100, sort: "fullName" }), adminUsersService.roles(),
      ]);
      const pages = await Promise.all(Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
        adminUsersService.list({ page: index + 2, pageSize: 100, sort: "fullName" })));
      setUsers([firstPage, ...pages].flatMap((page) => page.items.map(toUiUser)));
      setRoles(availableRoles);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách người dùng.";
      setLoadError(message); toast.error("Không thể tải dữ liệu người dùng.", { description: message });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(request);
  }, [load]);

  async function getDetail(id: string) { return toUiUser(await adminUsersService.get(Number(id))); }

  async function save(draft: UserDraft, id?: string): Promise<UserErrors> {
    try {
      if (!id) {
        const created = await adminUsersService.createStaff({
          email: draft.email.trim().toLowerCase(), fullName: draft.name.trim(), temporaryPassword: draft.password ?? "",
          phoneNumber: draft.phone.trim() || null, address: draft.address?.trim() || null,
        });
        setUsers((items) => [...items, toUiUser(created)]); toast.success("Đã tạo tài khoản nhân viên."); return {};
      }
      const current = users.find((user) => user.id === id);
      if (current && (current.role === "Khách hàng" || draft.role === "Khách hàng") && current.role !== draft.role)
        return { role: "Không thể thay đổi vai trò của tài khoản khách hàng." };
      let updated = await adminUsersService.updateProfile(Number(id), {
        fullName: draft.name.trim(), phoneNumber: draft.phone.trim() || null, address: draft.address?.trim() || null,
      });
      if (current && current.role !== draft.role) updated = await adminUsersService.updateRole(Number(id), roleToApi[draft.role]);
      const active = draft.status !== "Đã khóa";
      if (current && (current.status !== "Đã khóa") !== active) updated = await adminUsersService.updateStatus(Number(id), active);
      setUsers((items) => items.map((user) => user.id === id ? toUiUser(updated) : user));
      toast.success("Đã cập nhật thông tin người dùng."); return {};
    } catch (error) { return apiFormError(error); }
  }

  async function toggleStatus(id: string) {
    const current = users.find((user) => user.id === id); if (!current) return;
    try {
      const updated = await adminUsersService.updateStatus(Number(id), current.status === "Đã khóa");
      setUsers((items) => items.map((user) => user.id === id ? toUiUser(updated) : user));
      toast.success(current.status === "Đã khóa" ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
    } catch (error) { toast.error("Không thể cập nhật trạng thái.", { description: error instanceof Error ? error.message : undefined }); }
  }

  return { users, roles, loading, loadError, reload: load, getDetail, save, toggleStatus };
}

const Context = createContext<ReturnType<typeof useUsersState> | null>(null);
export function UsersProvider({ children }: { children: ReactNode }) { return <Context.Provider value={useUsersState()}>{children}</Context.Provider>; }
export function useUsers() { const value = useContext(Context); if (!value) throw new Error("Thiếu dữ liệu người dùng"); return value; }
