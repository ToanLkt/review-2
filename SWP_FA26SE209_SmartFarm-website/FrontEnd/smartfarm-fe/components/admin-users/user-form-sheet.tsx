"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DevicePanel } from "@/components/devices/device-ui";
import { Choice, Field, FormError } from "@/components/operations/shared/ui";
import { DiscardDialog } from "@/components/operations/shared/discard-dialog";
import {
  userRoles,
  userStatuses,
  validateUser,
  type SmartFarmUser,
  type UserDraft,
  type UserErrors,
} from "@/lib/users";
import { useUsers } from "./users-provider";
export function UserFormSheet({
  user,
  defaultRole = "Khách hàng",
  onClose,
  returnFocus,
}: {
  user?: SmartFarmUser;
  defaultRole?: UserDraft["role"];
  onClose: () => void;
  returnFocus: () => void;
}) {
  const { users, save } = useUsers();
  const [initial] = useState<UserDraft>(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    password: "",
    role: user?.role ?? defaultRole,
    status: user?.status ?? "Hoạt động",
  }));
  const [form, setForm] = useState(initial),
    [errors, setErrors] = useState<UserErrors>({}),
    [discard, setDiscard] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  function close() {
    if (dirty) setDiscard(true);
    else onClose();
  }
  async function submit() {
    const nextErrors = validateUser(form, users, user?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    const saved = await save(form, user?.id);
    setSaving(false);
    setErrors(saved);
    if (!Object.keys(saved).length) onClose();
  }
  return (
    <>
      <DevicePanel
        title={user ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
        description={
          user
            ? "Cập nhật thông tin tài khoản và vai trò truy cập."
            : "Tạo tài khoản mới trong hệ thống SmartFarm."
        }
        onClose={close}
        returnFocus={returnFocus}
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Hủy
            </Button>
            <Button type="submit" form="user-form" disabled={saving}>
              {saving ? "Đang lưu..." : user ? "Lưu thay đổi" : "Thêm nhân viên"}
            </Button>
          </>
        }
      >
        <form
          id="user-form"
          noValidate
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label="Họ và tên *" htmlFor="user-name" error={errors.name}>
            <Input
              id="user-name"
              autoFocus
              placeholder="Nhập họ và tên"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
          </Field>
          <Field label="Email *" htmlFor="user-email" error={errors.email}>
            <Input
              id="user-email"
              type="email"
              placeholder="ten@email.com"
              value={form.email}
              disabled={!!user}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
          </Field>
          <Field label="Địa chỉ" htmlFor="user-address" error={errors.address}>
            <Input id="user-address" placeholder="Nhập địa chỉ" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-invalid={!!errors.address} />
          </Field>
          <Field
            label="Số điện thoại"
            htmlFor="user-phone"
            error={errors.phone}
          >
            <Input
              id="user-phone"
              inputMode="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              aria-invalid={!!errors.phone}
            />
          </Field>
          {!user && (
            <Field
              label="Mật khẩu *"
              htmlFor="user-password"
              error={errors.password}
            >
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="pr-10"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  aria-invalid={!!errors.password}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </Field>
          )}
          {user ? user.role === "Khách hàng"
            ? <p className="rounded-xl bg-[#F3F8F4] p-3 text-sm">Vai trò: <strong>Khách hàng</strong> · không thể thay đổi</p>
            : <Field label="Vai trò *" error={errors.role}>
                <Choice label="Vai trò" value={form.role}
                  onChange={(v) => setForm({ ...form, role: v as UserDraft["role"] })}
                  options={userRoles.filter((role) => role !== "Khách hàng").map((role) => ({ value: role, label: role }))} />
              </Field>
            : <p className="rounded-xl bg-[#F3F8F4] p-3 text-sm">Vai trò: <strong>Nhân viên</strong></p>}
          {user && <Field label="Trạng thái" error={errors.status}>
            <Choice
              label="Trạng thái"
              value={form.status}
              onChange={(v) =>
                setForm({ ...form, status: v as UserDraft["status"] })
              }
              options={(user
                ? userStatuses
                : userStatuses.filter((v) => v !== "Đã khóa")
              ).map((v) => ({ value: v, label: v }))}
            />
          </Field>}
          <p className="rounded-xl bg-[#F3F8F4] p-4 text-xs leading-5 text-muted-foreground">
            {user
              ? "Mật khẩu không hiển thị trong biểu mẫu chỉnh sửa. Việc khóa tài khoản nên thực hiện bằng thao tác có xác nhận ở danh sách."
              : "Tài khoản nhân viên sẽ được kích hoạt sẵn và sử dụng mật khẩu tạm thời."}
          </p>
          <FormError message={errors.form} />
        </form>
      </DevicePanel>
      <DiscardDialog
        open={discard}
        onOpenChange={setDiscard}
        onConfirm={onClose}
        creating={!user}
      />
    </>
  );
}
