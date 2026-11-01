import { customerSession } from "../customer-session";
import { ApiClient, ApiError } from "./client";
import { apiClient } from "./instance";
import {
  tokenStorage,
  withTokenRefreshLock,
  type TokenPersistence,
  type TokenStore,
} from "./token-storage";
import type {
  ApiResponse,
  AuthTokens,
  LoginResponse,
  UserResponse,
} from "./types";

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string | null;
};

export type ConfirmEmailRequest = {
  email: string;
  token: string;
};

export type ResendConfirmEmailRequest = {
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UpdateProfileRequest = {
  fullName: string;
  phone: string;
  address: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  resetToken: string;
  newPassword: string;
};

type AuthServiceDependencies = {
  client?: ApiClient;
  tokens?: TokenStore;
};

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data === null) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response.data;
}

function ensureSuccess<T>(response: ApiResponse<T>, fallback: string) {
  if (!response.success) {
    throw new ApiError(response.message || fallback, 200, response, response);
  }
  return response;
}

function collectErrorMessages(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectErrorMessages);
  }
  return [];
}

function isFetchNetworkError(error: TypeError) {
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed/i
    .test(error.message);
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const body = typeof error.body === "object" && error.body !== null
      ? error.body as Record<string, unknown>
      : null;
    const validationMessages = collectErrorMessages(
      error.response?.errors ?? body?.errors,
    );
    const rawMessage = [
      ...validationMessages,
      typeof body?.message === "string" ? body.message : "",
      typeof body?.title === "string" ? body.title : "",
      error.message,
    ].filter(Boolean).join(" ").toLowerCase();

    if (/insufficient.*capacity|not enough.*tray|capacity.*exceed|no.*available.*tray/.test(rawMessage)) {
      return "Không đủ khay trống. Vui lòng chọn số lượng ít hơn.";
    }
    if (/out.?of.?stock|insufficient.*stock|not enough.*stock/.test(rawMessage)) {
      return "Sản phẩm đã hết hàng hoặc không đủ số lượng. Vui lòng chọn số lượng ít hơn.";
    }
    if (/invalid.*seed|seed.*not found|invalid.*variety/.test(rawMessage)) {
      return "Giống rau đã chọn không hợp lệ. Vui lòng chọn lại.";
    }
    if (/timeout|timed out/.test(rawMessage) && /payment|transaction/.test(rawMessage)) {
      return "Chưa thể xác nhận thanh toán. Vui lòng kiểm tra lại sau ít phút.";
    }
    if (/risk acceptance|required before payment|accept.*risk/.test(rawMessage)) {
      return "Đơn thuê này chưa ghi nhận xác nhận rủi ro gieo trồng nên chưa thể thanh toán. Vui lòng không tạo lại đơn và liên hệ SmartFarm để được hỗ trợ.";
    }
    if (/invalid.*credential|invalid.*email.*password|incorrect.*password|wrong.*password|email.*password.*invalid/.test(rawMessage)) {
      return "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.";
    }
    if (/full name.*(two words|at least)/.test(rawMessage)) {
      return "Họ và tên cần có ít nhất hai từ.";
    }
    if (/password.*uppercase/.test(rawMessage)) return "Mật khẩu cần có chữ hoa.";
    if (/password.*lowercase/.test(rawMessage)) return "Mật khẩu cần có chữ thường.";
    if (/password.*number/.test(rawMessage)) return "Mật khẩu cần có chữ số.";
    if (/password.*special character/.test(rawMessage)) return "Mật khẩu cần có ký tự đặc biệt.";
    if (/email.*already|already.*email|duplicate.*email/.test(rawMessage)) {
      return "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.";
    }
    if (/email.*not.*confirm|unconfirmed.*email/.test(rawMessage)) {
      return "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và xác nhận email.";
    }
    if (/current.*password|old.*password/.test(rawMessage)) {
      return "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.";
    }
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy thông tin yêu cầu.";
    if (error.status === 429) return "Bạn thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại.";
    if (error.status === 409) return "Thông tin đã thay đổi. Vui lòng tải lại và thử lại.";
    if (error.status >= 500) return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
    return fallback;
  }
  if (error instanceof TypeError) {
    if (isFetchNetworkError(error)) {
      return "Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.";
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[AUTH] Unexpected frontend TypeError", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return "Đã xảy ra lỗi trên trình duyệt. Vui lòng tải lại trang và thử lại.";
  }
  return fallback;
}

export function createAuthService({
  client = apiClient,
  tokens = tokenStorage,
}: AuthServiceDependencies = {}) {
  let restorePromise: Promise<UserResponse | null> | null = null;

  async function restoreSessionOnce() {
    if (tokens.getAccessToken()) {
      const response = await client.get<UserResponse>("/auth/me");
      const user = unwrap(response, "Không thể khôi phục phiên đăng nhập.");
      customerSession.setUser(user);
      return user;
    }

    return withTokenRefreshLock(async () => {
      const refreshToken = tokens.getRefreshToken();
      if (!refreshToken) return null;
      const response = await client.post<LoginResponse, { refreshToken: string }>(
        "/auth/refresh-token",
        { refreshToken },
        { auth: false, retryOnUnauthorized: false },
      );
      const result = unwrap(response, "Không thể khôi phục phiên đăng nhập.");
      const next = result.tokens;
      if (!next?.accessToken || !next.refreshToken || !result.user) {
        throw new ApiError(
          "Phản hồi khôi phục phiên không đầy đủ.",
          502,
          response,
          response,
        );
      }
      tokens.setTokens({
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        expiresAt: next.expiresAt,
      }, tokens.getPersistence());
      customerSession.setUser(result.user);
      return result.user;
    });
  }

  return {
    hasSession() {
      return Boolean(tokens.getAccessToken() || tokens.getRefreshToken());
    },

    getCurrentUser() {
      return customerSession.getUser();
    },

    clearSession() {
      tokens.clear();
      customerSession.clear();
    },

    restoreSession() {
      if (!restorePromise) {
        restorePromise = restoreSessionOnce().finally(() => {
          restorePromise = null;
        });
      }
      return restorePromise;
    },

    async register(request: RegisterRequest) {
      const response = await client.post<UserResponse, RegisterRequest>(
        "/auth/register",
        request,
        { auth: false },
      );
      return unwrap(response, "Không thể tạo tài khoản.");
    },

    async confirmEmail(request: ConfirmEmailRequest) {
      const response = await client.post<unknown, ConfirmEmailRequest>(
        "/auth/confirm-email",
        request,
        { auth: false },
      );
      if (!response.success) {
        throw new ApiError(
          response.message || "Không thể xác nhận email.",
          200,
          response,
          response,
        );
      }
      return response;
    },

    async resendConfirmEmail(request: ResendConfirmEmailRequest) {
      const response = await client.post<unknown, ResendConfirmEmailRequest>(
        "/auth/resend-confirm-email",
        request,
        { auth: false },
      );
      if (!response.success) {
        throw new ApiError(
          response.message || "Không thể gửi lại email xác nhận.",
          200,
          response,
          response,
        );
      }
      return response;
    },

    async login(request: LoginRequest, persistence: TokenPersistence) {
      const response = await client.post<LoginResponse, LoginRequest>(
        "/auth/login",
        request,
        { auth: false },
      );
      const result = unwrap(response, "Đăng nhập không thành công.");
      const next = result.tokens;
      if (!next?.accessToken || !next.refreshToken || !result.user) {
        throw new ApiError(
          "Phản hồi đăng nhập không có đầy đủ token hoặc thông tin người dùng.",
          200,
          response,
          response,
        );
      }
      const authTokens: AuthTokens = {
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        expiresAt: next.expiresAt,
      };
      tokens.setTokens(authTokens, persistence);
      customerSession.setUser(result.user);
      return result;
    },

    async getMe() {
      const response = await client.get<UserResponse>("/auth/me");
      const user = unwrap(response, "Không thể lấy thông tin tài khoản.");
      customerSession.setUser(user);
      return user;
    },

    async updateProfile(request: UpdateProfileRequest) {
      const response = await client.put<UserResponse, UpdateProfileRequest>(
        "/auth/me",
        request,
      );
      const user = unwrap(response, "Không thể cập nhật hồ sơ.");
      customerSession.setUser(user);
      return user;
    },

    async changePassword(request: ChangePasswordRequest) {
      const response = await client.post<Record<string, never>, ChangePasswordRequest>(
        "/auth/change-password",
        request,
      );
      return ensureSuccess(response, "Không thể đổi mật khẩu.");
    },

    async forgotPassword(request: ForgotPasswordRequest) {
      const response = await client.post<unknown, ForgotPasswordRequest>(
        "/auth/forgot-password",
        request,
        { auth: false },
      );
      return ensureSuccess(response, "Không thể gửi yêu cầu đặt lại mật khẩu.");
    },

    async resetPassword(request: ResetPasswordRequest) {
      const response = await client.post<unknown, ResetPasswordRequest>(
        "/auth/reset-password",
        request,
        { auth: false },
      );
      return ensureSuccess(response, "Không thể đặt lại mật khẩu.");
    },

    async logout() {
      const refreshToken = tokens.getRefreshToken();
      try {
        if (refreshToken) {
          await client.post<unknown, { refreshToken: string }>(
            "/auth/logout",
            { refreshToken },
          );
        }
      } finally {
        tokens.clear();
        customerSession.clear();
      }
    },
  };
}

export const authService = createAuthService();
