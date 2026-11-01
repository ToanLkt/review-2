"use client";

import { LoadingState } from "@/components/ui/loading-state";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/customer-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authService, getAuthErrorMessage } from "@/lib/api";
import type { UserResponse } from "@/lib/api";

export function StaffProfile({ role = "staff" }: { role?: "staff" | "admin" }) {
  const { user, status, refreshSession } = useAuth();
  if (status === "loading") return <LoadingState label="Đang tải hồ sơ..." className="min-h-64" />;
  if (!user) return <div className="p-16 text-center text-sm text-destructive">Không thể tải thông tin tài khoản.</div>;
  return <StaffProfileContent key={user.userId} user={user} role={role} refreshSession={refreshSession} />;
}

function StaffProfileContent({ user, role, refreshSession }: { user: UserResponse; role: "staff" | "admin"; refreshSession: () => Promise<UserResponse | null> }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ fullName: user.fullName || "", phone: user.phone || "", address: user.address || "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false); const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (window.location.hash !== "#change-password") return;
    const frame = requestAnimationFrame(() => document.getElementById("change-password")?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile.fullName.trim()) return toast.error("Vui lòng nhập họ và tên.");
    setSaving(true);
    try { await authService.updateProfile({ fullName: profile.fullName.trim(), phone: profile.phone.trim(), address: profile.address.trim() }); await refreshSession(); toast.success("Đã cập nhật hồ sơ."); }
    catch (reason) { toast.error(getAuthErrorMessage(reason, "Không thể cập nhật hồ sơ.")); }
    finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!password.currentPassword) return toast.error("Vui lòng nhập mật khẩu hiện tại.");
    if (password.newPassword.length < 8) return toast.error("Mật khẩu mới cần ít nhất 8 ký tự.");
    if (password.newPassword !== password.confirmPassword) return toast.error("Xác nhận mật khẩu không khớp.");
    setChanging(true);
    try { await authService.changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }); authService.clearSession(); router.replace("/sign-in"); }
    catch (reason) { toast.error(getAuthErrorMessage(reason, "Không thể đổi mật khẩu.")); setChanging(false); }
  }

  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tài khoản</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#173B29]">Thông tin cá nhân</h1><p className="mt-2 text-sm text-muted-foreground">Quản lý thông tin cá nhân và bảo mật tài khoản.</p></header>
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
      <Card className="border-[#E1ECE4] shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-primary"><UserRound /></span><div><h2 className="font-bold text-[#173B29]">{user.fullName || user.email}</h2><p className="mt-1 text-sm text-muted-foreground">{role === "admin" ? "Quản trị viên" : "Nhân viên"}</p></div></div><dl className="mt-6 divide-y text-sm">{[["Email", user.email || "—"], ["Xác nhận email", user.emailConfirmed ? "Đã xác nhận" : "Chưa xác nhận"], ["Trạng thái", user.isActive ? "Đang hoạt động" : "Đã khóa"], ["Ngày tạo", formatDate(user.createdAt)]].map(([label, value]) => <div className="flex justify-between gap-4 py-3" key={label}><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></CardContent></Card>
      <div className="space-y-6">
        <Card className="border-[#E1ECE4] shadow-sm"><CardContent className="p-6"><h2 className="font-semibold text-[#173B29]">Chỉnh sửa hồ sơ</h2><form className="mt-5 space-y-4" onSubmit={saveProfile}><Field label="Họ và tên"><Input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Số điện thoại"><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></Field><Field label="Email"><Input disabled value={user.email || ""} /></Field></div><Field label="Địa chỉ"><Input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></Field><Button disabled={saving}><Save />{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></form></CardContent></Card>
        <Card id="change-password" className="scroll-mt-28 border-[#E1ECE4] shadow-sm"><CardContent className="p-6"><div className="flex items-center gap-2"><ShieldCheck className="text-primary" /><h2 className="font-semibold text-[#173B29]">Đổi mật khẩu</h2></div><p className="mt-2 text-xs text-muted-foreground">Sau khi đổi mật khẩu, bạn cần đăng nhập lại.</p><form className="mt-5 space-y-4" onSubmit={changePassword}><Field label="Mật khẩu hiện tại"><Input type="password" autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Mật khẩu mới"><Input type="password" autoComplete="new-password" value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} /></Field><Field label="Xác nhận mật khẩu"><Input type="password" autoComplete="new-password" value={password.confirmPassword} onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })} /></Field></div><Button disabled={changing}><KeyRound />{changing ? "Đang xử lý..." : "Đổi mật khẩu"}</Button></form></CardContent></Card>
      </div>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN"); }
