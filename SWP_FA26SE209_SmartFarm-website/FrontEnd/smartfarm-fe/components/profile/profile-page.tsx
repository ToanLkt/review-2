"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, CircleAlert, CreditCard, KeyRound, Mail,
  MapPin, Pencil, Phone, ShieldCheck, UserRound,
} from "lucide-react";

import { useCustomerAuth } from "@/components/auth/customer-auth-provider";
import { PageHeader } from "@/components/user/user-ui";
import { authService, getAuthErrorMessage } from "@/lib/api";

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-[#dce9e0] bg-[#f7faf8] px-4 text-sm outline-none transition-colors focus:border-[#4F8F68] focus:bg-white focus:ring-2 focus:ring-[#4F8F68]/10 disabled:cursor-not-allowed disabled:text-[#9ca3af]";
type ProfileDraft = { fullName: string; phone: string; address: string };
type EditMode = "profile" | "password" | null;

function memberSince(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa xác định"
    : new Intl.DateTimeFormat("vi-VN", { month: "2-digit", year: "numeric" }).format(date);
}

export function ProfilePage() {
  const router = useRouter();
  const { user, status } = useCustomerAuth();
  const [draft, setDraft] = useState<ProfileDraft>({ fullName: "", phone: "", address: "" });
  const [mode, setMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (status === "loading") return <main className="mx-auto max-w-7xl px-6 py-20 text-sm text-[#6b7280]">Đang tải hồ sơ...</main>;
  if (!user) return <main className="mx-auto max-w-7xl px-6 py-20 text-sm text-[#b91c1c]">Không thể tải hồ sơ tài khoản.</main>;

  function clearMessages() { setSuccess(""); setError(""); }
  function startProfileEdit() {
    if (!user) return;
    setDraft({ fullName: user.fullName ?? "", phone: user.phone ?? "", address: user.address ?? "" });
    clearMessages();
    setMode("profile");
  }
  function cancelEdit() {
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    clearMessages(); setMode(null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    if (!draft.fullName.trim()) { setError("Vui lòng nhập họ và tên."); return; }
    setSaving(true);
    try {
      await authService.updateProfile({ fullName: draft.fullName.trim(), phone: draft.phone.trim(), address: draft.address.trim() });
      setMode(null); setSuccess("Đã cập nhật hồ sơ thành công.");
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể cập nhật hồ sơ."));
    } finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearMessages();
    if (!currentPassword) { toast.error("Vui lòng nhập mật khẩu hiện tại."); return; }
    if (newPassword.length < 8) { toast.error("Mật khẩu mới cần ít nhất 8 ký tự."); return; }
    if (newPassword !== confirmPassword) { toast.error("Xác nhận mật khẩu mới không khớp."); return; }
    setPasswordSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      authService.clearSession();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode(null);
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      router.replace("/sign-in");
    } catch (requestError) {
      const message = getAuthErrorMessage(requestError, "Không thể đổi mật khẩu.");
      toast.error(
        message === "Current password is incorrect."
          ? "Mật khẩu hiện tại không chính xác."
          : message,
      );
    } finally { setPasswordSaving(false); }
  }

  const profileFields = [
    { label: "Họ và tên", value: user.fullName, icon: UserRound },
    { label: "Số điện thoại", value: user.phone, icon: Phone },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Địa chỉ", value: user.address, icon: MapPin },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản và bảo mật SmartFarm." />
      <div className="grid items-start gap-8 lg:grid-cols-4">
        <aside className="rounded-2xl border border-[#e8f3eb] bg-white p-6 lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center"><span className="flex size-20 items-center justify-center rounded-2xl bg-[#E8F3EB] text-[#4F8F68]"><UserRound size={36} /></span><h2 className="mt-4 text-lg font-bold">{user.fullName || "Khách hàng SmartFarm"}</h2><p className="mt-1 break-all text-sm text-[#6b7280]">{user.email}</p></div>
          <dl className="mt-6 divide-y divide-[#e8f3eb] border-t border-[#e8f3eb] text-sm">
            {[["Trạng thái", user.isActive ? "Đang hoạt động" : "Đã khóa"], ["Email", user.emailConfirmed ? "Đã xác nhận" : "Chưa xác nhận"], ["Thành viên từ", memberSince(user.createdAt)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-3.5"><dt className="text-[#6b7280]">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}
          </dl>
        </aside>

        <div className="space-y-6 lg:col-span-3">
          {success && <p role="status" className="flex items-center gap-2 rounded-xl border border-[#4F8F68]/20 bg-[#E8F3EB] px-4 py-3 text-sm text-[#3F7655]"><CheckCircle2 size={17} />{success}</p>}
          {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b91c1c]"><CircleAlert size={17} />{error}</p>}

          <section className="rounded-2xl border border-[#e8f3eb] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Thông tin cá nhân</h2><p className="mt-1 text-sm text-[#6b7280]">Thông tin dùng cho đơn hàng và giao nhận.</p></div>{mode !== "profile" && <button type="button" onClick={startProfileEdit} className="inline-flex items-center gap-2 rounded-xl border border-[#4F8F68] px-4 py-2.5 text-sm font-semibold text-[#4F8F68] hover:bg-[#E8F3EB]"><Pencil size={16} />Chỉnh sửa hồ sơ</button>}</div>
            {mode === "profile" ? (
              <form onSubmit={saveProfile} className="mt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Họ và tên<input value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} className={fieldClass} /></label>
                  <label className="block text-sm font-semibold">Số điện thoại<input type="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} /></label>
                  <label className="block text-sm font-semibold">Email <span className="font-normal text-[#9ca3af]">(không thể chỉnh sửa)</span><input type="email" value={user.email ?? ""} disabled className={fieldClass} /></label>
                  <label className="block text-sm font-semibold">Địa chỉ<input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} className={fieldClass} /></label>
                </div>
                <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={saving} className="rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button><button type="button" onClick={cancelEdit} disabled={saving} className="rounded-xl border border-[#e8f3eb] px-5 py-3 text-sm font-semibold text-[#6b7280] hover:bg-[#f3f8f4] disabled:opacity-60">Hủy</button></div>
              </form>
            ) : <dl className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">{profileFields.map(({ label, value, icon: Icon }) => <div key={label} className="flex min-w-0 gap-3 border-t border-[#e8f3eb] py-4"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f8f4] text-[#4F8F68]"><Icon size={17} /></span><div className="min-w-0"><dt className="text-xs text-[#6b7280]">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value || "Chưa cập nhật"}</dd></div></div>)}</dl>}
          </section>

          <section className="rounded-2xl border border-[#e8f3eb] bg-white p-6">
            <div><h2 className="text-xl font-bold">Tài khoản và bảo mật</h2><p className="mt-1 text-sm text-[#6b7280]">Kiểm tra thanh toán và bảo vệ tài khoản của bạn.</p></div>
            <div className="mt-6 divide-y divide-[#e8f3eb] border-y border-[#e8f3eb]">
              <Link href="/profile/payment-history" className="flex items-center gap-4 py-4 hover:text-[#4F8F68]"><span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]"><CreditCard size={19} /></span><span className="flex-1"><strong className="block text-sm">Lịch sử thanh toán</strong><span className="mt-1 block text-xs text-[#6b7280]">Xem giao dịch và trạng thái thanh toán</span></span><ChevronRight size={18} className="text-[#9ca3af]" /></Link>
              {mode !== "password" && <button type="button" onClick={() => { clearMessages(); setMode("password"); }} className="flex w-full items-center gap-4 py-4 text-left hover:text-[#4F8F68]"><span className="flex size-10 items-center justify-center rounded-xl bg-[#f3f8f4] text-[#4F8F68]"><KeyRound size={19} /></span><span className="flex-1"><strong className="block text-sm">Đổi mật khẩu</strong><span className="mt-1 block text-xs text-[#6b7280]">Cập nhật mật khẩu đăng nhập</span></span><ChevronRight size={18} className="text-[#9ca3af]" /></button>}
            </div>
            {mode === "password" && (
              <form onSubmit={changePassword} className="mt-6">
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f3f8f4] p-4 text-sm text-[#3F7655]"><ShieldCheck size={20} />Mật khẩu mới cần có ít nhất 8 ký tự.</div>
                <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold sm:col-span-2">Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} /></label><label className="block text-sm font-semibold">Mật khẩu mới<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} /></label><label className="block text-sm font-semibold">Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClass} /></label></div>
                <div className="mt-6 flex flex-wrap gap-3"><button type="submit" disabled={passwordSaving} className="rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:opacity-60">{passwordSaving ? "Đang lưu..." : "Lưu mật khẩu"}</button><button type="button" onClick={cancelEdit} disabled={passwordSaving} className="rounded-xl border border-[#e8f3eb] px-5 py-3 text-sm font-semibold text-[#6b7280] hover:bg-[#f3f8f4] disabled:opacity-60">Hủy</button></div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
