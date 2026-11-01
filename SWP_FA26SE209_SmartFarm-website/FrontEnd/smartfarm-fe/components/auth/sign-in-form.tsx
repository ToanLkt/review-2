"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAuthLandingPath,
  isValidSignInEmail,
  sanitizeReturnTo,
} from "@/lib/auth";
import { authService, getAuthErrorMessage } from "@/lib/api";

type FieldErrors = { email?: string; password?: string };

export function SignInForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!authService.hasSession()) return;

    void authService.getMe()
      .then((user) => {
        if (!active) return;
        const destination = getAuthLandingPath(
          user.role,
          sanitizeReturnTo(returnTo),
        );
        if (destination) router.replace(destination);
        else authService.clearSession();
      })
      .catch(() => authService.clearSession());

    return () => {
      active = false;
    };
  }, [returnTo, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Vui lòng nhập email.";
    else if (!isValidSignInEmail(email)) nextErrors.email = "Email không hợp lệ.";
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await authService.login(
        { email: email.trim(), password },
        remember ? "local" : "session",
      );
      const user = await authService.getMe();
      const destination = getAuthLandingPath(
        user.role,
        sanitizeReturnTo(returnTo),
      );
      if (!destination) {
        try {
          await authService.logout();
        } catch {
          // Auth service still clears local tokens if Backend logout fails.
        }
        setFormError("Role tài khoản không được hệ thống hỗ trợ.");
        return;
      }
      router.replace(destination);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, "Đăng nhập không thành công."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="sign-in-email" className="mb-2 block text-sm font-semibold">Email</label>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
              setFormError("");
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "sign-in-email-error" : undefined}
            placeholder="ban@smartfarm.vn"
            className="h-12 rounded-xl border-[#e8f3eb] bg-white px-4 text-sm shadow-none"
          />
          {errors.email && <p id="sign-in-email-error" className="mt-2 text-xs text-[#EF5350]">{errors.email}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="sign-in-password" className="text-sm font-semibold">Mật khẩu</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#4F8F68] hover:underline">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <Input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
                setFormError("");
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "sign-in-password-error" : undefined}
              placeholder="Nhập mật khẩu"
              className="h-12 rounded-xl border-[#e8f3eb] bg-white px-4 pr-12 text-sm shadow-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6b7280] hover:text-[#4F8F68]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p id="sign-in-password-error" className="mt-2 text-xs text-[#EF5350]">{errors.password}</p>}
        </div>

        <label className="flex w-fit items-center gap-2 text-sm text-[#374151]">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-[#4F8F68]" />
          Ghi nhớ đăng nhập
        </label>

        {formError && <p role="alert" className="rounded-xl border border-[#EF5350]/25 bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">{formError}</p>}

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-[#4F8F68] text-sm font-semibold text-white hover:bg-[#3F7655]">
          {loading ? <><LoaderCircle size={17} className="animate-spin" />Đang đăng nhập...</> : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-[#6b7280]">
        Chưa có tài khoản? <Link href="/sign-up" className="font-semibold text-[#4F8F68] hover:underline">Đăng ký ngay</Link>
      </p>
    </>
  );
}
