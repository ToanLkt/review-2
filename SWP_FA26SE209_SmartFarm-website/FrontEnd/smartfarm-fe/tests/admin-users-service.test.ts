import assert from "node:assert/strict";
import test from "node:test";

import { createAdminUsersService } from "@/lib/api/admin/admin-users-service";
import { createApiClient } from "@/lib/api/client";
import type { TokenStore } from "@/lib/api/token-storage";

const tokenStore: TokenStore = {
  getAccessToken: () => "admin-token",
  getRefreshToken: () => null,
  getExpiresAt: () => null,
  getPersistence: () => "session",
  setTokens: () => undefined,
  clear: () => undefined,
};

function jsonResponse(data: unknown) {
  return new Response(
    JSON.stringify({ success: true, message: "OK", data, errors: null }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

test("admin user service maps all seven Backend endpoints", async () => {
  const calls: { method: string; path: string; query: string; body: unknown; auth: string }[] = [];
  const user = {
    userId: 7,
    email: "staff@smartfarm.local",
    fullName: "SmartFarm Staff",
    phone: "0900000000",
    address: "TP.HCM",
    role: "STAFF",
    isActive: true,
    emailConfirmed: true,
    createdAt: "2026-10-09T01:00:00Z",
    avatarUrl: null,
    updatedAt: null,
  };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore,
    fetcher: async (input, init) => {
      const url = new URL(String(input));
      const body = init?.body ? JSON.parse(String(init.body)) as unknown : null;
      calls.push({
        method: init?.method ?? "GET",
        path: url.pathname,
        query: url.search,
        body,
        auth: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (url.pathname.endsWith("/admin/users")) {
        return jsonResponse({ items: [user], page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
      }
      if (url.pathname.endsWith("/admin/roles")) {
        return jsonResponse([{ roleId: 2, name: "STAFF", userCount: 1 }]);
      }
      return jsonResponse(user);
    },
  });
  const service = createAdminUsersService(client);

  await service.list({ search: "staff", role: "STAFF", isActive: true, page: 1, pageSize: 20 });
  await service.get(7);
  await service.createStaff({
    email: user.email,
    fullName: user.fullName,
    temporaryPassword: "Temporary123!",
    phoneNumber: user.phone,
    address: user.address,
  });
  await service.updateProfile(7, { fullName: "Updated Staff", phoneNumber: null, address: null });
  await service.updateRole(7, "ADMIN");
  await service.updateStatus(7, false);
  await service.roles();

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "GET", path: "/api/v1/admin/users" },
    { method: "GET", path: "/api/v1/admin/users/7" },
    { method: "POST", path: "/api/v1/admin/users/staff" },
    { method: "PUT", path: "/api/v1/admin/users/7/profile" },
    { method: "PUT", path: "/api/v1/admin/users/7/role" },
    { method: "PUT", path: "/api/v1/admin/users/7/status" },
    { method: "GET", path: "/api/v1/admin/roles" },
  ]);
  assert.match(calls[0].query, /search=staff/);
  assert.match(calls[0].query, /role=STAFF/);
  assert.match(calls[0].query, /isActive=true/);
  assert.deepEqual(calls[4].body, { role: "ADMIN" });
  assert.deepEqual(calls[5].body, { isActive: false });
  assert.ok(calls.every((call) => call.auth === "Bearer admin-token"));
});
