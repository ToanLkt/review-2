import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthService,
  getAuthErrorMessage,
} from "@/lib/api/auth-service";
import { ApiError, createApiClient } from "@/lib/api/client";
import type { TokenPersistence, TokenStore } from "@/lib/api/token-storage";
import type { AuthTokens } from "@/lib/api/types";
import { customerSession } from "@/lib/customer-session";

function jsonResponse(data: unknown, message: string | null = null) {
  return new Response(JSON.stringify({ success: true, message, data, errors: null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createTokenStore(): TokenStore {
  let tokens: AuthTokens | null = null;
  let persistence: TokenPersistence = "session";

  return {
    getAccessToken: () => tokens?.accessToken ?? null,
    getRefreshToken: () => tokens?.refreshToken ?? null,
    getExpiresAt: () => tokens?.expiresAt ?? null,
    getPersistence: () => persistence,
    setTokens: (next, nextPersistence = "session") => {
      tokens = next;
      persistence = nextPersistence;
    },
    clear: () => {
      tokens = null;
    },
  };
}

test("auth errors distinguish network failures from frontend TypeErrors", () => {
  assert.equal(
    getAuthErrorMessage(new TypeError("Failed to fetch"), "Fallback"),
    "Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.",
  );
  assert.equal(
    getAuthErrorMessage(new TypeError("Illegal invocation"), "Fallback"),
    "Đã xảy ra lỗi trên trình duyệt. Vui lòng tải lại trang và thử lại.",
  );
});

test("auth errors explain registration validation failures", () => {
  const response = {
    success: false,
    message: "Validation failed",
    data: null,
    errors: ["Full name must contain at least two words."],
  };
  assert.equal(
    getAuthErrorMessage(new ApiError("Validation failed", 400, response, response), "Fallback"),
    "Họ và tên cần có ít nhất hai từ.",
  );
});

test("auth errors explain invalid Backend login credentials", () => {
  const response = {
    success: false,
    message: "Invalid email or password.",
    data: null,
    errors: null,
  };
  assert.equal(
    getAuthErrorMessage(new ApiError("Invalid email or password.", 401, response, response), "Fallback"),
    "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
  );
});

test("auth errors explain confirmation email resend throttling", () => {
  const response = {
    success: false,
    message: "Please wait 60 seconds before requesting another email.",
    data: null,
    errors: null,
  };
  assert.equal(
    getAuthErrorMessage(new ApiError(response.message, 429, response, response), "Fallback"),
    "Bạn thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại.",
  );
});

const user = {
  userId: 12,
  email: "customer@smartfarm.vn",
  fullName: "Khách hàng",
  phone: "0901234567",
  address: null,
  role: "Customer",
  isActive: true,
  emailConfirmed: true,
  createdAt: "2026-10-01T00:00:00Z",
};

test("auth service maps register, confirm and resend DTOs", async () => {
  const calls: { path: string; body: unknown; authorization: string }[] = [];
  const tokens = createTokenStore();
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const path = new URL(String(input)).pathname;
      calls.push({
        path,
        body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      return path.endsWith("/register") ? jsonResponse(user) : jsonResponse(null, "OK");
    },
  });
  const service = createAuthService({ client, tokens });

  await service.register({
    email: user.email,
    password: "Password123!",
    fullName: user.fullName,
    phone: user.phone,
    address: null,
  });
  await service.confirmEmail({ email: user.email, token: "confirm-token" });
  await service.resendConfirmEmail({ email: user.email });

  assert.deepEqual(calls.map((call) => call.path), [
    "/api/v1/auth/register",
    "/api/v1/auth/confirm-email",
    "/api/v1/auth/resend-confirm-email",
  ]);
  assert.deepEqual(calls[1].body, { email: user.email, token: "confirm-token" });
  assert.deepEqual(calls[2].body, { email: user.email });
  assert.ok(calls.every((call) => call.authorization === ""));
});

test("login stores tokens, me uses Bearer, and logout revokes refresh token", async () => {
  customerSession.clear();
  const calls: { path: string; body: unknown; authorization: string }[] = [];
  const tokens = createTokenStore();
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const path = new URL(String(input)).pathname;
      calls.push({
        path,
        body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (path.endsWith("/login")) {
        return jsonResponse({
          tokens: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresAt: "2030-01-01T00:00:00Z",
          },
          user,
        });
      }
      return path.endsWith("/me") ? jsonResponse(user) : jsonResponse(null, "Logged out");
    },
  });
  const service = createAuthService({ client, tokens });

  await service.login({ email: user.email, password: "Password123!" }, "local");
  const currentUser = await service.getMe();
  await service.logout();

  assert.equal(currentUser.userId, user.userId);
  assert.equal(calls[1].authorization, "Bearer access-token");
  assert.deepEqual(calls[2].body, { refreshToken: "refresh-token" });
  assert.equal(tokens.getRefreshToken(), null);
  assert.equal(customerSession.getUser(), null);
});

test("reload refreshes the stored session before loading protected data", async () => {
  customerSession.clear();
  const calls: { path: string; authorization: string }[] = [];
  const tokens = createTokenStore();
  tokens.setTokens({ accessToken: "", refreshToken: "stored-refresh-token", expiresAt: null }, "local");
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const path = new URL(String(input)).pathname;
      calls.push({ path, authorization: new Headers(init?.headers).get("Authorization") ?? "" });
      return jsonResponse({
        tokens: { accessToken: "restored-access-token", refreshToken: "rotated-refresh-token", expiresAt: "2030-01-01T00:00:00Z" },
        user,
      });
    },
  });

  const restored = await createAuthService({ client, tokens }).restoreSession();

  assert.equal(restored?.userId, user.userId);
  assert.deepEqual(calls, [{ path: "/api/v1/auth/refresh-token", authorization: "" }]);
  assert.equal(tokens.getAccessToken(), "restored-access-token");
  assert.equal(tokens.getRefreshToken(), "rotated-refresh-token");
  assert.equal(tokens.getPersistence(), "local");
  assert.equal(customerSession.getUser()?.userId, user.userId);
});

test("concurrent reload restoration shares one refresh request", async () => {
  customerSession.clear();
  const tokens = createTokenStore();
  tokens.setTokens({ accessToken: "", refreshToken: "stored-refresh-token", expiresAt: null }, "local");
  let refreshCalls = 0;
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async () => {
      refreshCalls += 1;
      await Promise.resolve();
      return jsonResponse({
        tokens: { accessToken: "restored-access-token", refreshToken: "rotated-refresh-token", expiresAt: null },
        user,
      });
    },
  });
  const service = createAuthService({ client, tokens });

  const [first, second] = await Promise.all([
    service.restoreSession(),
    service.restoreSession(),
  ]);

  assert.equal(first?.userId, user.userId);
  assert.equal(second?.userId, user.userId);
  assert.equal(refreshCalls, 1);
});

test("profile and password methods map Backend DTOs and auth requirements", async () => {
  customerSession.clear();
  const calls: { method: string; path: string; body: unknown; authorization: string }[] = [];
  const tokens = createTokenStore();
  tokens.setTokens({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: null,
  });
  const updatedUser = { ...user, fullName: "Tên mới", address: "Địa chỉ mới" };
  const client = createApiClient({
    baseUrl: "http://localhost:5080",
    tokenStore: tokens,
    fetcher: async (input, init) => {
      const path = new URL(String(input)).pathname;
      calls.push({
        method: init?.method ?? "GET",
        path,
        body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
        authorization: new Headers(init?.headers).get("Authorization") ?? "",
      });
      if (path.endsWith("/me")) return jsonResponse(updatedUser);
      if (path.endsWith("/change-password")) {
        return jsonResponse({}, "Password changed successfully");
      }
      return jsonResponse(null, "OK");
    },
  });
  const service = createAuthService({ client, tokens });

  await service.updateProfile({ fullName: "Tên mới", phone: user.phone, address: "Địa chỉ mới" });
  await service.changePassword({ currentPassword: "OldPassword!", newPassword: "NewPassword!" });
  await service.forgotPassword({ email: user.email });
  await service.resetPassword({ email: user.email, resetToken: "reset-token", newPassword: "NewPassword!" });

  assert.deepEqual(calls.map(({ method, path }) => ({ method, path })), [
    { method: "PUT", path: "/api/v1/auth/me" },
    { method: "POST", path: "/api/v1/auth/change-password" },
    { method: "POST", path: "/api/v1/auth/forgot-password" },
    { method: "POST", path: "/api/v1/auth/reset-password" },
  ]);
  assert.deepEqual(calls[0].body, { fullName: "Tên mới", phone: user.phone, address: "Địa chỉ mới" });
  assert.deepEqual(calls[1].body, { currentPassword: "OldPassword!", newPassword: "NewPassword!" });
  assert.deepEqual(calls[3].body, { email: user.email, resetToken: "reset-token", newPassword: "NewPassword!" });
  assert.equal(calls[0].authorization, "Bearer access-token");
  assert.equal(calls[1].authorization, "Bearer access-token");
  assert.equal(calls[2].authorization, "");
  assert.equal(calls[3].authorization, "");
  assert.equal(tokens.getAccessToken(), "access-token");
  assert.equal(customerSession.getUser()?.fullName, "Tên mới");
});
