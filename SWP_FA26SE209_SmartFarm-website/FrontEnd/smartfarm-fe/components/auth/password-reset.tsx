"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Leaf, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { authService, getAuthErrorMessage } from "@/lib/api";
import { isValidSignInEmail, passwordResetPath } from "@/lib/auth";

const inputClass = "h-12 w-full rounded-xl border border-[#dce9df] bg-[#f8fbf9] pl-11 pr-4 text-sm text-[#1a2e1f] outline-none transition focus:border-[#4F8F68] focus:bg-white focus:ring-4 focus:ring-[#4F8F68]/10";

function PasswordResetLayout({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#f3f8f4] px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-[#dce9df] bg-white p-6 shadow-[0_18px_55px_rgba(32,75,47,0.10)] sm:p-8">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-[#1a2e1f]"><span className="flex size-10 items-center justify-center rounded-xl bg-[#4F8F68] text-white"><Leaf size={21} /></span><span className="text-lg font-bold">SmartFarm</span></Link>
        <div className="mx-auto mt-8 flex size-12 items-center justify-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]">{icon}</div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-[#1a2e1f]">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-[#6b7280]">{description}</p>
        {children}
      </section>
    </main>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectEmail, setRedirectEmail] = useState("");

  useEffect(() => {
    if (!redirectEmail) return;
    const timer = window.setTimeout(() => {
      router.push(passwordResetPath(redirectEmail));
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [redirectEmail, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    setError("");
    if (!isValidSignInEmail(value)) { setError("Vui lòng nhập email hợp lệ."); return; }
    setLoading(true);
    try {
      await authService.forgotPassword({ email: value });
      setRedirectEmail(value);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể gửi yêu cầu đặt lại mật khẩu."));
    } finally { setLoading(false); }
  }

  return (
    <PasswordResetLayout icon={<Mail size={23} />} title="Quên mật khẩu?" description="Nhập email để nhận mã OTP đặt lại mật khẩu. Phản hồi không tiết lộ email có tồn tại trong hệ thống hay không.">
      {redirectEmail ? (
        <div className="mt-7" role="status" aria-live="polite">
          <div className="rounded-xl border border-[#4F8F68]/25 bg-[#f3f8f4] p-4">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[#4F8F68]" />
              <div>
                <p className="text-sm font-semibold text-[#1a2e1f]">Đã gửi mã OTP</p>
                <p className="mt-1 text-xs leading-5 text-[#6b7280]">Kiểm tra hộp thư của bạn. Mã OTP có hiệu lực trong 15 phút.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#4F8F68]">
            <LoaderCircle size={16} className="animate-spin" />
            Đang chuyển sang trang nhập OTP...
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7">
          <label htmlFor="reset-email" className="text-sm font-semibold text-[#374151]">Email</label>
          <div className="relative mt-2"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input id="reset-email" type="email" autoComplete="email" placeholder="tenban@email.com" className={inputClass} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} aria-invalid={Boolean(error)} /></div>
          {error && <p role="alert" className="mt-2 text-sm text-[#d14343]">{error}</p>}
          <button disabled={loading} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F8F68] px-4 text-sm font-semibold text-white transition hover:bg-[#3F7655] active:scale-[0.98] disabled:opacity-65">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? "Đang gửi..." : "Gửi mã OTP"}</button>
        </form>
      )}
      <Link href="/sign-in" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#4F8F68] hover:text-[#3F7655]"><ArrowLeft size={16} />Quay lại đăng nhập</Link>
    </PasswordResetLayout>
  );
}

export function ResetPasswordForm({ initialEmail = "", initialResetToken = "" }: { initialEmail?: string; initialResetToken?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!isValidSignInEmail(email)) { setError("Vui lòng nhập email hợp lệ."); return; }
    if (!/^\d{6}$/.test(resetToken)) { setError("Mã OTP phải gồm đúng 6 chữ số."); return; }
    if (password.length < 8) { setError("Mật khẩu mới cần ít nhất 8 ký tự."); return; }
    if (password !== confirm) { setError("Xác nhận mật khẩu mới không khớp."); return; }
    setLoading(true);
    try {
      await authService.resetPassword({ email: email.trim().toLowerCase(), resetToken: resetToken.trim(), newPassword: password });
      setMessage("Mật khẩu đã được đặt lại thành công.");
      setCompleted(true);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể đặt lại mật khẩu."));
    } finally { setLoading(false); }
  }

  return (
    <PasswordResetLayout icon={<KeyRound size={23} />} title="Đặt lại mật khẩu" description="Dùng email và mã OTP 6 chữ số SmartFarm gửi để tạo mật khẩu mới.">
      {completed ? (
        <div className="mt-7 text-center"><CheckCircle2 size={40} className="mx-auto text-[#4F8F68]" /><p role="status" className="mt-3 text-sm text-[#3F7655]">{message}</p><Link href="/sign-in" className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#4F8F68] text-sm font-semibold text-white hover:bg-[#3F7655]">Đăng nhập</Link></div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-[#374151]">Email<div className="relative mt-2"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input type="email" autoComplete="email" className={inputClass} value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} /></div></label>
          <div>
            <label htmlFor="reset-otp" className="block text-sm font-semibold text-[#374151]">Mã OTP</label>
            <div className="relative mt-2"><KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input id="reset-otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" autoFocus className={`${inputClass} font-mono tracking-[0.32em]`} value={resetToken} onChange={(event) => { setResetToken(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} aria-describedby="reset-otp-help" /></div>
            <p id="reset-otp-help" className="mt-2 text-xs leading-5 text-[#6b7280]">Nhập mã 6 số trong email. Mã có hiệu lực trong 15 phút.</p>
          </div>
          <label className="block text-sm font-semibold text-[#374151]">Mật khẩu mới<div className="relative mt-2"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} /></div></label>
          <label className="block text-sm font-semibold text-[#374151]">Xác nhận mật khẩu mới<div className="relative mt-2"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} /></div></label>
          {error && <p role="alert" className="text-sm text-[#d14343]">{error}</p>}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F8F68] px-4 text-sm font-semibold text-white hover:bg-[#3F7655] disabled:opacity-65">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}</button>
        </form>
      )}
      {!completed && <div className="mt-6 flex flex-col items-center gap-3 text-sm font-semibold"><Link href="/forgot-password" className="text-[#4F8F68] hover:text-[#3F7655]">Gửi lại mã OTP</Link><Link href="/sign-in" className="flex items-center gap-2 text-[#4F8F68] hover:text-[#3F7655]"><ArrowLeft size={16} />Quay lại đăng nhập</Link></div>}
    </PasswordResetLayout>
  );
}
