import { customerSession } from "./customer-session";

export type AuthRole = "admin" | "staff" | "user";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

type MockAccount = MockUser & { password: string };

export const mockSessionKey = "smartfarm_mock_session";
export const demoAccountsKey = "smartfarm_demo_accounts";

export const customerOnlyRoutes = [
  "/cart",
  "/checkout",
  "/delivery",
  "/my-trays",
  "/notifications",
  "/orders",
  "/payment",
  "/profile",
  "/rent-tray",
  "/rentals",
] as const;

const customerPublicRoutes = [
  "/payment-success",
  "/privacy",
  "/seeds",
  "/seed-varieties",
  "/terms",
  "/tray-capacity",
] as const;

export function currentDemoUser(): MockUser | null {
  const customer = customerSession.getUser();
  if (customer) {
    return {
      id: String(customer.userId),
      name: customer.fullName ?? customer.email ?? "Khách hàng SmartFarm",
      email: customer.email ?? "",
      role: "user",
    };
  }
  try { const raw = localStorage.getItem(mockSessionKey) ?? sessionStorage.getItem(mockSessionKey); return raw ? JSON.parse(raw) as MockUser : null; } catch { return null; }
}

export function isCustomer(user: MockUser | null): user is MockUser & { role: "user" } {
  return user?.role === "user";
}

export function isCustomerSession(): boolean {
  return typeof window !== "undefined" && isCustomer(currentDemoUser());
}

export function clearLegacyCustomerSession() {
  if (typeof window === "undefined") return;
  for (const key of ["localStorage", "sessionStorage"] as const) {
    try {
      const storage = window[key];
      const raw = storage.getItem(mockSessionKey);
      const user = raw ? JSON.parse(raw) as MockUser : null;
      if (user?.role === "user") storage.removeItem(mockSessionKey);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }
}

export function isCustomerOnlyPath(pathname: string): boolean {
  return customerOnlyRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/sign-in") || value.startsWith("/sign-up")) return "/";
  return value;
}

function matchesRoute(path: string, route: string) {
  const pathname = path.split("?", 1)[0];
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isReturnToAllowedForRole(
  role: AuthRole,
  returnTo: string | null | undefined,
) {
  const path = sanitizeReturnTo(returnTo);
  if (role === "admin") return matchesRoute(path, "/admin");
  if (role === "staff") return matchesRoute(path, "/staff");
  if (path === "/") return true;
  return [...customerOnlyRoutes, ...customerPublicRoutes].some((route) =>
    matchesRoute(path, route)
  );
}

export function signInPath(returnTo?: string): string {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  return safeReturnTo === "/" ? "/sign-in" : `/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function passwordResetPath(email: string): string {
  return `/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function getPathWithSearch(pathname: string, searchParams?: URLSearchParams | null): string {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function currentBrowserPath(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  return `${window.location.pathname}${window.location.search}`;
}

export function readDemoAccounts(): (MockUser & { password: string })[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(demoAccountsKey) ?? "[]"); return Array.isArray(value) ? value as (MockUser & { password: string })[] : []; } catch { return []; }
}

export const mockAccounts: MockAccount[] = [
  { id: "admin-001", name: "Quản trị viên", email: "admin@smartfarm.vn", role: "admin", password: "Admin123!" },
  { id: "staff-001", name: "Nhân viên SmartFarm", email: "staff@smartfarm.vn", role: "staff", password: "Staff123!" },
  { id: "user-001", name: "Khách hàng SmartFarm", email: "user@smartfarm.vn", role: "user", password: "User123!" },
];

export function authenticateMockUser(email: string, password: string): MockUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const demos = typeof window === "undefined" ? [] : readDemoAccounts();
  const account = [...demos, ...mockAccounts.filter((item) => !demos.some((demo) => demo.email === item.email))].find((item) => item.email === normalizedEmail && item.password === password);
  if (!account) return null;

  return { id: account.id, name: account.name, email: account.email, role: account.role };
}

export function isValidSignInEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getMockLandingPath(role: AuthRole): string | null {
  if (role === "admin") return "/admin/dashboard";
  if (role === "staff") return "/staff/dashboard";
  if (role === "user") return "/";
  return null;
}

export function normalizeAuthRole(role: string | null | undefined): AuthRole | null {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "staff") return "staff";
  if (normalized === "customer" || normalized === "user") return "user";
  return null;
}

export function getAuthLandingPath(
  role: string | null | undefined,
  returnTo = "/",
): string | null {
  const normalizedRole = normalizeAuthRole(role);
  if (!normalizedRole) return null;
  if (isReturnToAllowedForRole(normalizedRole, returnTo)) {
    return sanitizeReturnTo(returnTo);
  }
  if (normalizedRole === "admin") return "/admin/dashboard";
  if (normalizedRole === "staff") return "/staff/dashboard";
  if (normalizedRole === "user") return "/";
  return null;
}

export type SignUpInput = { name: string; email: string; phone: string; password: string };

export function validateSignUp(input: SignUpInput): Partial<Record<keyof SignUpInput, string>> {
  const errors: Partial<Record<keyof SignUpInput, string>> = {};
  const fullNameParts = input.name.trim().split(/\s+/).filter(Boolean);
  if (fullNameParts.length === 0) errors.name = "Vui lòng nhập họ và tên.";
  else if (fullNameParts.length < 2) errors.name = "Họ và tên cần có ít nhất hai từ.";
  if (!isValidSignInEmail(input.email)) errors.email = "Email không hợp lệ.";
  if (!/^0\d{9}$/.test(input.phone.replace(/\s/g, ""))) errors.phone = "Số điện thoại không hợp lệ.";
  if (input.password.length < 8) errors.password = "Mật khẩu cần ít nhất 8 ký tự.";
  else if (!/[A-Z]/.test(input.password)) errors.password = "Mật khẩu cần có chữ hoa.";
  else if (!/[a-z]/.test(input.password)) errors.password = "Mật khẩu cần có chữ thường.";
  else if (!/[0-9]/.test(input.password)) errors.password = "Mật khẩu cần có chữ số.";
  else if (!/[^a-zA-Z0-9]/.test(input.password)) errors.password = "Mật khẩu cần có ký tự đặc biệt.";
  return errors;
}

export const validateMockSignUp = validateSignUp;
