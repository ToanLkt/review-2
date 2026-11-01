import type { ApiClient } from "../client";
import type { UserResponse } from "../types";

export const ADMIN_USER_ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

export type AdminUsersQuery = {
  search?: string;
  role?: AdminUserRole;
  isActive?: boolean;
  sort?: "fullName" | "-fullName" | "email" | "-createdAt";
  page?: number;
  pageSize?: number;
};

export type PagedAdminUsers = {
  items: UserResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CreateStaffRequest = {
  email: string;
  fullName: string;
  temporaryPassword: string;
  phoneNumber?: string | null;
  address?: string | null;
};

export type AdminUpdateUserRequest = {
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
};

export type AdminRole = {
  roleId: number;
  name: AdminUserRole | string;
  userCount: number;
};

function requireData<T>(data: T | null, message: string): T {
  if (data === null) throw new Error(message);
  return data;
}

export function createAdminUsersService(client: ApiClient) {
  return {
    async list(query: AdminUsersQuery = {}) {
      const response = await client.get<PagedAdminUsers>("/admin/users", { query });
      return requireData(response.data, "Không nhận được danh sách người dùng.");
    },

    async get(userId: number) {
      const response = await client.get<UserResponse>(`/admin/users/${userId}`);
      return requireData(response.data, "Không nhận được thông tin người dùng.");
    },

    async createStaff(request: CreateStaffRequest) {
      const response = await client.post<UserResponse, CreateStaffRequest>(
        "/admin/users/staff",
        request,
      );
      return requireData(response.data, "Không nhận được thông tin tài khoản vừa tạo.");
    },

    async updateProfile(userId: number, request: AdminUpdateUserRequest) {
      const response = await client.put<UserResponse, AdminUpdateUserRequest>(
        `/admin/users/${userId}/profile`,
        request,
      );
      return requireData(response.data, "Không nhận được thông tin người dùng đã cập nhật.");
    },

    async updateRole(userId: number, role: AdminUserRole) {
      const response = await client.put<UserResponse, { role: AdminUserRole }>(
        `/admin/users/${userId}/role`,
        { role },
      );
      return requireData(response.data, "Không nhận được vai trò người dùng đã cập nhật.");
    },

    async updateStatus(userId: number, isActive: boolean) {
      const response = await client.put<UserResponse, { isActive: boolean }>(
        `/admin/users/${userId}/status`,
        { isActive },
      );
      return requireData(response.data, "Không nhận được trạng thái tài khoản đã cập nhật.");
    },

    async roles() {
      const response = await client.get<AdminRole[]>("/admin/roles");
      return requireData(response.data, "Không nhận được danh sách vai trò.");
    },
  };
}
