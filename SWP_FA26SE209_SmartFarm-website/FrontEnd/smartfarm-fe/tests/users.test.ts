import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPermissions,
  initialUsers,
  normalizedUserText,
  permissionLabels,
  saveUser,
  validateUser,
} from "../lib/users";
test("Dữ liệu người dùng khớp ba chỉ số tổng hợp", () => {
  assert.equal(initialUsers.filter((u) => u.role === "Khách hàng").length, 4);
  assert.equal(initialUsers.filter((u) => u.role !== "Khách hàng").length, 5);
  assert.equal(
    initialUsers.filter((u) => u.role === "Quản trị viên").length,
    1,
  );
  assert.equal(initialUsers.filter((u) => u.role === "Nhân viên").length, 4);
  assert.equal(initialUsers.filter((u) => u.status === "Đã khóa").length, 2);
  assert.equal(
    initialUsers.filter((u) => u.status === "Chờ kích hoạt").length,
    1,
  );
});
test("Ma trận có đúng mười quyền quản trị theo thứ tự", () => {
  assert.deepEqual(Object.values(permissionLabels), [
    "Quản lý tài khoản",
    "Quản lý vai trò & quyền",
    "Quản lý khu vực & thiết bị",
    "Quản lý giá",
    "Truy cập báo cáo",
    "Quản lý khay & tầng kệ",
    "Quản lý giống rau",
    "Truy cập dữ liệu cảm biến",
    "Điều khiển thiết bị",
    "Xử lý đơn hàng",
  ]);
  assert.equal(initialPermissions["Khách hàng"].length, 0);
  assert.equal(
    initialPermissions["Quản trị viên"].length,
    Object.keys(permissionLabels).length,
  );
});
test("Tìm kiếm người dùng không phân biệt dấu và chữ hoa", () => {
  assert.equal(
    normalizedUserText("Nguyễn Thị Lan").includes(
      normalizedUserText("nguyen thi"),
    ),
    true,
  );
  assert.equal(
    normalizedUserText("ĐỖ NGỌC").includes(normalizedUserText("do ngoc")),
    true,
  );
});
test("Kiểm tra email duy nhất, định dạng điện thoại và mật khẩu tạo mới", () => {
  const draft = {
    name: "",
    email: "LAN.NGUYEN@GMAIL.COM",
    phone: "123",
    password: "ngan",
    role: "Khách hàng" as const,
    status: "Hoạt động" as const,
  };
  const errors = validateUser(draft, initialUsers);
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.password);
});
test("Tạo người dùng chuẩn hóa dữ liệu và không sửa danh sách cũ", () => {
  const before = structuredClone(initialUsers);
  const result = saveUser(initialUsers, {
    name: "  Võ Thu Hà  ",
    email: "  HA.VO@EMAIL.COM ",
    phone: "0945556677",
    password: "matkhau123",
    role: "Khách hàng",
    status: "Hoạt động",
  });
  assert.deepEqual(initialUsers, before);
  assert.equal(Object.keys(result.errors).length, 0);
  const created = result.users.at(-1)!;
  assert.equal(created.id, "USR-010");
  assert.equal(created.name, "Võ Thu Hà");
  assert.equal(created.email, "ha.vo@email.com");
});
test("Chỉnh sửa không yêu cầu mật khẩu và vẫn khóa email trùng", () => {
  const target = initialUsers[0];
  const valid = saveUser(
    initialUsers,
    {
      name: target.name,
      email: target.email,
      phone: target.phone,
      role: target.role,
      status: target.status,
    },
    target.id,
  );
  assert.equal(Object.keys(valid.errors).length, 0);
  const duplicate = saveUser(
    initialUsers,
    {
      name: target.name,
      email: initialUsers[1].email,
      phone: target.phone,
      role: target.role,
      status: target.status,
    },
    target.id,
  );
  assert.ok(duplicate.errors.email);
});
