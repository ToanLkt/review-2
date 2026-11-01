export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: unknown;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
};

export type AuthTokensResponse = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
};

export type UserResponse = {
  userId: number;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  role: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  avatarUrl: string | null;
  updatedAt: string | null;
};

export type LoginResponse = {
  tokens: AuthTokensResponse | null;
  user: UserResponse | null;
};

export type QueryValue = string | number | boolean | Date | null | undefined;

export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export type ApiRequestOptions<TBody = unknown> = Omit<
  RequestInit,
  "body" | "method"
> & {
  body?: TBody;
  query?: QueryParams;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};
