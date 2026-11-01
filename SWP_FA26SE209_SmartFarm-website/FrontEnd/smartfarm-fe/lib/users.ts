export const userRoles = ["Khách hàng", "Nhân viên", "Quản trị viên"] as const;
export const userStatuses = ["Hoạt động", "Đã khóa", "Chờ kích hoạt"] as const;
export type UserRole = (typeof userRoles)[number];
export const apiRoleLabels: Record<string, UserRole> = {
  ADMIN: "Quản trị viên", STAFF: "Nhân viên", CUSTOMER: "Khách hàng",
};
export type UserStatus = (typeof userStatuses)[number];
export type SmartFarmUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  detail: string;
  color: string;
};
export type UserDraft = Pick<
  SmartFarmUser,
  "name" | "email" | "phone" | "role" | "status"
> & { address?: string; password?: string };
export type UserErrors = Partial<Record<keyof UserDraft | "form", string>>;
export const initialUsers: SmartFarmUser[] = [
  {
    id: "USR-001",
    name: "Nguyễn Thị Lan",
    email: "lan.nguyen@gmail.com",
    phone: "0901112233",
    role: "Khách hàng",
    status: "Hoạt động",
    createdAt: "2025-07-15",
    detail: "8 đơn · thuê khay + mua hạt giống",
    color: "bg-[#5D9C76]",
  },
  {
    id: "USR-002",
    name: "Trần Văn Hùng",
    email: "hung.tran@email.com",
    phone: "0912223344",
    role: "Khách hàng",
    status: "Hoạt động",
    createdAt: "2025-08-20",
    detail: "3 đơn · mua hạt giống",
    color: "bg-[#5B8DB8]",
  },
  {
    id: "USR-003",
    name: "Lê Thị Mai",
    email: "mai.le@email.com",
    phone: "0923334455",
    role: "Khách hàng",
    status: "Hoạt động",
    createdAt: "2026-09-05",
    detail: "1 đơn · thuê khay",
    color: "bg-[#8A79B8]",
  },
  {
    id: "USR-004",
    name: "Phạm Minh Tuấn",
    email: "tuan.pham@email.com",
    phone: "0934445566",
    role: "Khách hàng",
    status: "Đã khóa",
    createdAt: "2025-06-18",
    detail: "0 đơn",
    color: "bg-[#B7796E]",
  },
  {
    id: "USR-005",
    name: "Nguyễn Minh",
    email: "minh.nguyen@smartfarm.vn",
    phone: "0905001001",
    role: "Quản trị viên",
    status: "Hoạt động",
    createdAt: "2025-01-10",
    detail: "Quản trị hệ thống",
    color: "bg-[#4F8F68]",
  },
  {
    id: "USR-006",
    name: "Minh Anh",
    email: "minh.anh@smartfarm.vn",
    phone: "0905001002",
    role: "Nhân viên",
    status: "Hoạt động",
    createdAt: "2025-03-12",
    detail: "Phụ trách gieo trồng",
    color: "bg-[#568BA6]",
  },
  {
    id: "USR-007",
    name: "Quốc Bảo",
    email: "quoc.bao@smartfarm.vn",
    phone: "0905001003",
    role: "Nhân viên",
    status: "Hoạt động",
    createdAt: "2025-04-08",
    detail: "Phụ trách thiết bị & khay",
    color: "bg-[#6D9A72]",
  },
  {
    id: "USR-008",
    name: "Hồng Phúc",
    email: "hong.phuc@smartfarm.vn",
    phone: "0905001004",
    role: "Nhân viên",
    status: "Đã khóa",
    createdAt: "2025-05-20",
    detail: "Phụ trách đóng gói",
    color: "bg-[#B07C72]",
  },
  {
    id: "USR-009",
    name: "Trần Thu",
    email: "tran.thu@smartfarm.vn",
    phone: "0905001005",
    role: "Nhân viên",
    status: "Chờ kích hoạt",
    createdAt: "2026-09-12",
    detail: "Phụ trách giao nhận",
    color: "bg-[#C19455]",
  },
];
export const normalizedUserText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN")
    .trim();
export function validateUser(
  draft: UserDraft,
  users: SmartFarmUser[],
  id?: string,
): UserErrors {
  const e: UserErrors = {};
  const name = draft.name.trim(),
    email = draft.email.trim().toLowerCase(),
    phone = draft.phone.trim(),
    address = (draft.address ?? "").trim();
  if (!name) e.name = "Vui lòng nhập họ và tên.";
  if (!email) e.email = "Vui lòng nhập email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = "Email không đúng định dạng.";
  else if (users.some((u) => u.id !== id && u.email.toLowerCase() === email))
    e.email = "Email này đã được sử dụng.";
  if (phone && !/^0\d{9}$/.test(phone))
    e.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
  if (address.length > 255) e.address = "Địa chỉ không được vượt quá 255 ký tự.";
  if (!id && (!draft.password || draft.password.length < 8))
    e.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  if (!userRoles.includes(draft.role)) e.role = "Vui lòng chọn vai trò.";
  if (!userStatuses.includes(draft.status))
    e.status = "Vui lòng chọn trạng thái.";
  return e;
}
export function saveUser(
  users: SmartFarmUser[],
  draft: UserDraft,
  id?: string,
) {
  const errors = validateUser(draft, users, id);
  if (Object.keys(errors).length) return { users, errors };
  const clean = {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone.trim(),
    address: (draft.address ?? "").trim(),
    role: draft.role,
    status: draft.status,
  };
  if (id)
    return {
      users: users.map((u) =>
        u.id === id
          ? {
              ...u,
              ...clean,
              detail:
                clean.role === "Khách hàng"
                  ? u.detail
                  : clean.role === "Quản trị viên"
                    ? "Quản trị hệ thống"
                    : u.detail,
            }
          : u,
      ),
      errors,
    };
  const sequence = Math.max(...users.map((u) => Number(u.id.slice(4))), 0) + 1;
  return {
    users: [
      ...users,
      {
        ...clean,
        id: "USR-" + String(sequence).padStart(3, "0"),
        createdAt: "2026-09-17",
        detail:
          clean.role === "Khách hàng"
            ? "0 đơn"
            : clean.role === "Quản trị viên"
              ? "Quản trị hệ thống"
              : "Nhân viên mới",
        color: "bg-[#4F8F68]",
      },
    ],
    errors,
  };
}
export const permissionLabels = {
  "accounts.manage": "Quản lý tài khoản",
  "roles.manage": "Quản lý vai trò & quyền",
  "areas-devices.manage": "Quản lý khu vực & thiết bị",
  "pricing.manage": "Quản lý giá",
  "reports.access": "Truy cập báo cáo",
  "trays-shelves.manage": "Quản lý khay & tầng kệ",
  "varieties.manage": "Quản lý giống rau",
  "sensors.access": "Truy cập dữ liệu cảm biến",
  "devices.control": "Điều khiển thiết bị",
  "orders.manage": "Xử lý đơn hàng",
} as const;
export type Permission = keyof typeof permissionLabels;
export const initialPermissions: Record<UserRole, Permission[]> = {
  "Khách hàng": [],
  "Nhân viên": [
    "areas-devices.manage",
    "reports.access",
    "trays-shelves.manage",
    "varieties.manage",
    "sensors.access",
    "devices.control",
    "orders.manage",
  ],
  "Quản trị viên": Object.keys(permissionLabels) as Permission[],
};
