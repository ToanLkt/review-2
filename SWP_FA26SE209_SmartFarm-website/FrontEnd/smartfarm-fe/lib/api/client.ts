import {
  tokenStorage,
  withTokenRefreshLock,
  type TokenStore,
} from "./token-storage";
import type {
  ApiRequestOptions,
  ApiResponse,
  AuthTokens,
  LoginResponse,
  QueryParams,
  QueryValue,
} from "./types";

const defaultApiPrefix = "/api/v1";
const refreshPath = "/auth/refresh-token";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type ApiClientConfig = {
  baseUrl?: string;
  apiPrefix?: string;
  fetcher?: Fetcher;
  tokenStore?: TokenStore;
  onUnauthorized?: () => void;
};

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function requiredBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!value) {
    throw new Error("Không thể kết nối. Vui lòng thử lại sau.");
  }
  return value;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePrefix(value: string) {
  const normalized = value.replace(/^\/*|\/*$/g, "");
  return normalized ? `/${normalized}` : "";
}

function appendQueryValue(
  params: URLSearchParams,
  key: string,
  value: QueryValue,
) {
  if (value === null || value === undefined) return;
  params.append(key, value instanceof Date ? value.toISOString() : String(value));
}

export function buildApiUrl(
  baseUrl: string,
  apiPrefix: string,
  path: string,
  query?: QueryParams,
) {
  const prefix = normalizePrefix(apiPrefix);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithPrefix =
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
      ? normalizedPath
      : `${prefix}${normalizedPath}`;
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${pathWithPrefix}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        value.forEach((item) => appendQueryValue(url.searchParams, key, item));
      } else {
        appendQueryValue(url.searchParams, key, value);
      }
    }
  }

  return url.toString();
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof value.success === "boolean"
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "Dữ liệu chưa sẵn sàng. Vui lòng thử lại.",
      response.status,
      null,
      text,
    );
  }
}

export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: ApiResponse<T> | null,
    public readonly body: unknown,
  ) {
    super(/\b(api|backend|frontend|endpoint|server|token|payload|json|database|sql)\b/i.test(message)
      ? "Không thể xử lý yêu cầu. Vui lòng thử lại."
      : message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly fetcher: Fetcher;
  private readonly tokens: TokenStore;
  private readonly onUnauthorized?: () => void;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? requiredBaseUrl());
    this.apiPrefix = config.apiPrefix ?? defaultApiPrefix;
    this.fetcher = config.fetcher
      ?? ((input, init) => globalThis.fetch(input, init));
    this.tokens = config.tokenStore ?? tokenStorage;
    this.onUnauthorized = config.onUnauthorized;
  }

  get<T>(path: string, options?: ApiRequestOptions<never>) {
    return this.request<T, never>("GET", path, options);
  }

  post<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<T, TBody>("POST", path, { ...options, body });
  }

  put<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<T, TBody>("PUT", path, { ...options, body });
  }

  patch<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<T, TBody>("PATCH", path, { ...options, body });
  }

  delete<T, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<T, TBody>("DELETE", path, { ...options, body });
  }

  async request<T, TBody = unknown>(
    method: RequestMethod,
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ): Promise<ApiResponse<T>> {
    const {
      auth = true,
      body,
      headers: initialHeaders,
      query,
      retryOnUnauthorized = true,
      ...init
    } = options;
    const url = buildApiUrl(this.baseUrl, this.apiPrefix, path, query);
    const headers = new Headers(initialHeaders);
    headers.set("Accept", "application/json");

    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const accessToken = auth ? this.tokens.getAccessToken() : null;
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await this.fetcher(url, {
      ...init,
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const refreshedAccessToken = await this.refreshAccessToken();
      if (refreshedAccessToken) {
        return this.request<T, TBody>(method, path, {
          ...options,
          retryOnUnauthorized: false,
        });
      }

      this.tokens.clear();
      this.onUnauthorized?.();
    }

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const body = await readResponseBody(response);

    if (response.status === 204) {
      return {
        success: true,
        message: null,
        data: null,
        errors: null,
      };
    }

    const apiResponse = isApiResponse(body)
      ? (body as ApiResponse<T>)
      : null;

    if (!response.ok) {
      throw new ApiError(
        apiResponse?.message || "Không thể xử lý yêu cầu. Vui lòng thử lại.",
        response.status,
        apiResponse,
        body,
      );
    }

    if (!apiResponse) {
      throw new ApiError(
        "Dữ liệu chưa sẵn sàng. Vui lòng thử lại.",
        response.status,
        null,
        body,
      );
    }

    return apiResponse;
  }

  private refreshAccessToken() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<string | null> {
    return withTokenRefreshLock(async () => {
      const refreshToken = this.tokens.getRefreshToken();
      if (!refreshToken) return null;

      try {
        const response = await this.request<LoginResponse, { refreshToken: string }>(
          "POST",
          refreshPath,
          {
            auth: false,
            body: { refreshToken },
            retryOnUnauthorized: false,
          },
        );
        const next = response.data?.tokens;
        if (
          !response.success
          || !next?.accessToken?.trim()
          || !next.refreshToken?.trim()
        ) {
          throw new ApiError(
            "Backend refresh response is incomplete.",
            502,
            response,
            response,
          );
        }

        const tokens: AuthTokens = {
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          expiresAt: next.expiresAt ?? null,
        };
        this.tokens.setTokens(tokens, this.tokens.getPersistence());
        return tokens.accessToken;
      } catch (error) {
        if (
          error instanceof ApiError
          && [400, 401, 403].includes(error.status)
        ) {
          return null;
        }
        throw error;
      }
    });
  }
}

export function createApiClient(config: ApiClientConfig = {}) {
  return new ApiClient(config);
}
