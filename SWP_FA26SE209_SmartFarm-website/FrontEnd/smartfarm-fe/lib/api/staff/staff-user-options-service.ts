import type { ApiClient } from "../client";

export type StaffUserOption = { userId: number; fullName: string; email: string; role: string };
export type StaffUserOptionsPage = { items: StaffUserOption[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function createStaffUserOptionsService(client: ApiClient) {
  return {
    async list(query: { role?: "STAFF" | "CUSTOMER" | "ADMIN"; search?: string; page?: number; pageSize?: number } = {}) {
      const response = await client.get<StaffUserOptionsPage>("/staff/users/options", { query });
      if (!response.data) throw new Error("Không thể tải danh sách người dùng.");
      return response.data;
    },
  };
}
