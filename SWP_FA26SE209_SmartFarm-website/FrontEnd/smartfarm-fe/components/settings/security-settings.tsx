"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordField, SettingsCard } from "@/components/settings/settings-ui";
import { authService, getAuthErrorMessage } from "@/lib/api/auth-service";
import { validatePasswordChange } from "@/lib/settings";

type PasswordValues = { current: string; next: string; confirm: string };

export function SecuritySettings() {
  const router = useRouter();
  const [passwords, setPasswords] = useState<PasswordValues>({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordValues, string>>>({});
  const [saving, setSaving] = useState(false);

  function update(key: keyof PasswordValues, value: string) {
    setPasswords((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submitPassword() {
    const nextErrors = validatePasswordChange(passwords);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || saving) return;
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      authService.clearSession();
      toast.success("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
      router.replace("/sign-in");
    } catch (reason) { toast.error(getAuthErrorMessage(reason, "Không thể đổi mật khẩu.")); }
    finally { setSaving(false); }
  }

  return <SettingsCard title="Đổi mật khẩu" description="Sau khi đổi mật khẩu, các phiên đăng nhập cũ hết hiệu lực và bạn cần đăng nhập lại.">
    <div className="space-y-5 p-5 sm:p-6">
      <PasswordField id="current-password" label="Mật khẩu hiện tại" value={passwords.current} onChange={(value) => update("current", value)} error={errors.current} autoComplete="current-password" />
      <PasswordField id="new-password" label="Mật khẩu mới" value={passwords.next} onChange={(value) => update("next", value)} error={errors.next} autoComplete="new-password" />
      <PasswordField id="confirm-password" label="Xác nhận mật khẩu mới" value={passwords.confirm} onChange={(value) => update("confirm", value)} error={errors.confirm} autoComplete="new-password" />
      <div className="flex justify-end border-t pt-5"><Button type="button" disabled={saving} onClick={() => { void submitPassword(); }}>{saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button></div>
    </div>
  </SettingsCard>;
}
