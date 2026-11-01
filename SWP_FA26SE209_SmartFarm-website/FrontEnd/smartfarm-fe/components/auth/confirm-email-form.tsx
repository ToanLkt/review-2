"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";

import { authService, getAuthErrorMessage } from "@/lib/api";
import { isValidSignInEmail } from "@/lib/auth";
import {
  clearConfirmationEmail,
  getConfirmationEmailSnapshot,
  readConfirmationEmail,
  rememberConfirmationEmail,
  subscribeToConfirmationEmail,
} from "@/lib/confirmation-email-storage";

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#e8f3eb] bg-white px-4 text-sm outline-none focus:border-[#4F8F68]";

type ConfirmEmailFormProps = {
  initialEmail?: string;
  initialToken?: string;
  registered?: boolean;
};

export function ConfirmEmailForm({
  initialEmail = "",
  initialToken = "",
  registered = false,
}: ConfirmEmailFormProps) {
  const storedEmailSnapshot = useSyncExternalStore(
    subscribeToConfirmationEmail,
    getConfirmationEmailSnapshot,
    () => null,
  );
  const storedEmail = readConfirmationEmail(storedEmailSnapshot);
  const [editedEmail, setEditedEmail] = useState<string | null>(null);
  const rememberedEmail = initialEmail.trim().toLowerCase() || storedEmail;
  const email = editedEmail ?? rememberedEmail;
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    registered ? "Tài khoản đã được tạo. Vui lòng kiểm tra email để lấy mã xác nhận." : "",
  );
  const autoConfirmStarted = useRef(false);

  useEffect(() => {
    if (isValidSignInEmail(initialEmail)) rememberConfirmationEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (storedEmailSnapshot && !storedEmail) clearConfirmationEmail();
  }, [storedEmail, storedEmailSnapshot]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function confirm() {
    if (!isValidSignInEmail(email) || !token.trim()) {
      setError("Vui lòng nhập email hợp lệ và mã xác nhận.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      await authService.confirmEmail({
        email: email.trim(),
        token: token.trim(),
      });
      clearConfirmationEmail();
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("code");
      url.searchParams.delete("userId");
      window.history.replaceState(window.history.state, "", url);
      setConfirmed(true);
      setNotice("Email đã được xác nhận thành công.");
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể xác nhận email."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isValidSignInEmail(rememberedEmail) || !initialToken || autoConfirmStarted.current) return;
    autoConfirmStarted.current = true;
    void confirm();
    // Run once for the confirmation link values received from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, rememberedEmail]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await confirm();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    if (!isValidSignInEmail(email)) {
      setError("Vui lòng nhập email hợp lệ trước khi gửi lại.");
      return;
    }

    setResending(true);
    setError("");
    setNotice("");
    try {
      await authService.resendConfirmEmail({ email: email.trim() });
      setNotice("Email xác nhận mới đã được gửi.");
      setResendCooldown(60);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError, "Không thể gửi lại email xác nhận."));
    } finally {
      setResending(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-[#cfe3d4] bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-[#4F8F68]" size={42} />
        <h2 className="mt-4 text-xl font-bold">Xác nhận thành công</h2>
        <p role="status" className="mt-2 text-sm leading-6 text-[#6b7280]">{notice}</p>
        <Link href="/sign-in" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#4F8F68] px-6 text-sm font-semibold text-white hover:bg-[#3F7655]">
          Đến trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <label className="block text-sm font-semibold">
        Email
        <input type="email" autoComplete="email" value={email} onChange={(event) => { const nextEmail = event.target.value; setEditedEmail(nextEmail); if (isValidSignInEmail(nextEmail)) rememberConfirmationEmail(nextEmail); setError(""); }} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold">
        Mã xác nhận
        <input autoComplete="one-time-code" value={token} onChange={(event) => { setToken(event.target.value); setError(""); }} className={fieldClass} />
      </label>
      {notice && <p role="status" className="rounded-xl border border-[#4F8F68]/25 bg-[#E8F3EB] px-4 py-3 text-sm text-[#3F7655]">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-[#EF5350]/25 bg-red-50 px-4 py-3 text-sm text-[#b91c1c]">{error}</p>}
      <button type="submit" disabled={loading || resending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F8F68] text-sm font-semibold text-white disabled:opacity-60">
        {loading && <LoaderCircle size={17} className="animate-spin" />}
        {loading ? "Đang xác nhận..." : "Xác nhận email"}
      </button>
      <button type="button" onClick={handleResend} disabled={loading || resending || resendCooldown > 0} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cfe3d4] bg-white text-sm font-semibold text-[#4F8F68] disabled:opacity-60">
        {resending ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />}
        {resending ? "Đang gửi lại..." : resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại email xác nhận"}
      </button>
      <p className="pt-2 text-center text-sm text-[#6b7280]">
        <Link href="/sign-in" className="font-semibold text-[#4F8F68] hover:underline">Quay lại đăng nhập</Link>
      </p>
    </form>
  );
}
