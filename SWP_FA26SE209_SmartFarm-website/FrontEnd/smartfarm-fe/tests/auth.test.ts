import assert from "node:assert/strict";
import test from "node:test";
import { authenticateMockUser, getAuthLandingPath, getMockLandingPath, isCustomerOnlyPath, isReturnToAllowedForRole, isValidSignInEmail, normalizeAuthRole, passwordResetPath, sanitizeReturnTo, signInPath, validateSignUp } from "@/lib/auth";

test("đăng nhập đúng tài khoản Admin", () => {
  assert.deepEqual(authenticateMockUser("admin@smartfarm.vn", "Admin123!"), {
    id: "admin-001", name: "Quản trị viên", email: "admin@smartfarm.vn", role: "admin",
  });
});

test("đăng nhập đúng tài khoản Staff", () => {
  assert.equal(authenticateMockUser("staff@smartfarm.vn", "Staff123!")?.role, "staff");
});

test("đăng nhập đúng tài khoản User", () => {
  assert.equal(authenticateMockUser("user@smartfarm.vn", "User123!")?.role, "user");
});

test("từ chối mật khẩu sai và email không tồn tại", () => {
  assert.equal(authenticateMockUser("admin@smartfarm.vn", "wrong"), null);
  assert.equal(authenticateMockUser("unknown@smartfarm.vn", "Admin123!"), null);
});

test("chuẩn hóa khoảng trắng và chữ hoa trong email, giữ mật khẩu phân biệt hoa thường", () => {
  assert.equal(authenticateMockUser("  ADMIN@SMARTFARM.VN  ", "Admin123!")?.role, "admin");
  assert.equal(authenticateMockUser("admin@smartfarm.vn", "admin123!"), null);
});

test("kiểm tra định dạng email cơ bản", () => {
  assert.equal(isValidSignInEmail(" user@smartfarm.vn "), true);
  assert.equal(isValidSignInEmail("not-an-email"), false);
});

test("đăng ký kiểm tra cùng quy tắc họ tên và mật khẩu với Backend", () => {
  const valid = { name: "Nguyễn Toàn", email: "toan@example.com", phone: "0399221234", password: "Password123!" };
  assert.deepEqual(validateSignUp(valid), {});
  assert.ok(validateSignUp({ ...valid, name: "Toantoan" }).name);
  assert.ok(validateSignUp({ ...valid, password: "password123!" }).password);
  assert.ok(validateSignUp({ ...valid, password: "Password!" }).password);
  assert.ok(validateSignUp({ ...valid, password: "Password123" }).password);
});

test("chỉ trả route đích đang tồn tại cho Admin và User", () => {
  assert.equal(getMockLandingPath("admin"), "/admin/dashboard");
  assert.equal(getMockLandingPath("user"), "/");
  assert.equal(getMockLandingPath("staff"), "/staff/dashboard");
});

test("role Backend được chuẩn hóa và chuyển đến đúng khu vực", () => {
  assert.equal(normalizeAuthRole("Admin"), "admin");
  assert.equal(normalizeAuthRole("STAFF"), "staff");
  assert.equal(normalizeAuthRole("Customer"), "user");
  assert.equal(normalizeAuthRole("User"), "user");
  assert.equal(getAuthLandingPath("Admin", "/orders"), "/admin/dashboard");
  assert.equal(getAuthLandingPath("Staff", "/orders"), "/staff/dashboard");
  assert.equal(getAuthLandingPath("Customer", "/orders"), "/orders");
  assert.equal(getAuthLandingPath("Unknown"), null);
});

test("returnTo chỉ nhận đường dẫn nội bộ an toàn", () => {
  assert.equal(sanitizeReturnTo("/checkout?step=pay"), "/checkout?step=pay");
  assert.equal(sanitizeReturnTo("https://evil.example"), "/");
  assert.equal(sanitizeReturnTo("//evil.example"), "/");
  assert.equal(sanitizeReturnTo("/sign-in?returnTo=/checkout"), "/");
  assert.equal(signInPath("/orders/ord1"), "/sign-in?returnTo=%2Forders%2Ford1");
});

test("tạo đường dẫn nhập OTP kèm email đã chuẩn hóa", () => {
  assert.equal(
    passwordResetPath("  TOAN+Farm@Example.COM  "),
    "/reset-password?email=toan%2Bfarm%40example.com",
  );
});

test("returnTo không thể đưa user sang khu vực role khác", () => {
  assert.equal(getAuthLandingPath("Customer", "/admin/users"), "/");
  assert.equal(getAuthLandingPath("Customer", "/staff/dashboard"), "/");
  assert.equal(getAuthLandingPath("Admin", "/admin/users"), "/admin/users");
  assert.equal(getAuthLandingPath("Admin", "/staff/dashboard"), "/admin/dashboard");
  assert.equal(getAuthLandingPath("Staff", "/staff/orders"), "/staff/orders");
  assert.equal(getAuthLandingPath("Staff", "/orders"), "/staff/dashboard");
  assert.equal(isReturnToAllowedForRole("user", "/orders/12"), true);
  assert.equal(isReturnToAllowedForRole("user", "/unknown"), false);
});

test("route customer-only được nhận diện theo prefix", () => {
  assert.equal(isCustomerOnlyPath("/orders"), true);
  assert.equal(isCustomerOnlyPath("/orders/ord1"), true);
  assert.equal(isCustomerOnlyPath("/payment/PAY-1"), true);
  assert.equal(isCustomerOnlyPath("/seeds/s1"), false);
  assert.equal(isCustomerOnlyPath("/tray-capacity"), false);
});
