"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { getAuthLandingPath, validateSignUp, type SignUpInput } from "@/lib/auth";
import { authService, getAuthErrorMessage } from "@/lib/api";
import { rememberConfirmationEmail } from "@/lib/confirmation-email-storage";

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#e8f3eb] bg-white px-4 text-sm outline-none focus:border-[#4F8F68]";
const SIGN_UP_DRAFT_KEY = "smartfarm:sign-up-draft";

type SignUpFormInput = SignUpInput & {
  address: string;
  confirmPassword: string;
};

type SignUpDraft = Pick<SignUpFormInput, "name" | "email" | "phone" | "address">;
type SignUpFormErrors = Partial<Record<keyof SignUpFormInput, string>>;

const emptyInput: SignUpFormInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

function RequiredMark() {
  return <><span className="ml-1 text-[#EF5350]" aria-hidden="true">*</span><span className="sr-only"> (bắt buộc)</span></>;
}

function getSignUpDraftSnapshot() {
  try {
    return window.sessionStorage.getItem(SIGN_UP_DRAFT_KEY);
  } catch {
    return null;
  }
}

function parseSignUpDraft(stored: string | null): SignUpDraft | null {
  if (!stored) return null;
  try {
    const value: unknown = JSON.parse(stored);
    if (typeof value !== "object" || value === null) return null;
    const draft = value as Record<string, unknown>;
    return {
      name: typeof draft.name === "string" ? draft.name : "",
      email: typeof draft.email === "string" ? draft.email : "",
      phone: typeof draft.phone === "string" ? draft.phone : "",
      address: typeof draft.address === "string" ? draft.address : "",
    };
  } catch {
    return null;
  }
}

function subscribeToSignUpDraft() {
  return () => undefined;
}

function writeSignUpDraft(input: SignUpFormInput) {
  const draft: SignUpDraft = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
  };

  try {
    window.sessionStorage.setItem(SIGN_UP_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Registration remains usable when browser storage is disabled or unavailable.
  }
}

function clearSignUpDraft() {
  try {
    window.sessionStorage.removeItem(SIGN_UP_DRAFT_KEY);
  } catch {
    // A successful registration must not be blocked by browser storage errors.
  }
}

export function SignUpForm() {
  const router = useRouter();
  const storedDraft = useSyncExternalStore(
    subscribeToSignUpDraft,
    getSignUpDraftSnapshot,
    () => null,
  );
  const restoredDraft = parseSignUpDraft(storedDraft);
  const [editedInput, setEditedInput] = useState<SignUpFormInput | null>(null);
  const input: SignUpFormInput = editedInput ?? { ...emptyInput, ...restoredDraft };
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    if (!authService.hasSession()) return;
    void authService.getMe()
      .then((user) => {
        const destination = getAuthLandingPath(user.role);
        if (active && destination) router.replace(destination);
        else if (!destination) authService.clearSession();
      })
      .catch(() => authService.clearSession());
    return () => {
      active = false;
    };
  }, [router]);

  function setField(field: keyof SignUpFormInput, value: string) {
    const nextInput = { ...input, [field]: value };
    setEditedInput(nextInput);
    writeSignUpDraft(nextInput);
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: SignUpFormErrors = validateSignUp(input);
    if (!input.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (input.confirmPassword !== input.password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!accepted) {
      setFormError("Vui lòng đồng ý với điều khoản sử dụng.");
      return;
    }

    setLoading(true);
    try {
      const email = input.email.trim().toLowerCase();
      await authService.register({
        email,
        password: input.password,
        fullName: input.name.trim(),
        phone: input.phone.replace(/\s/g, ""),
        address: input.address.trim() || null,
      });
      rememberConfirmationEmail(email);
      clearSignUpDraft();
      router.replace(`/confirm-email?email=${encodeURIComponent(email)}&registered=1`);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, "Không thể tạo tài khoản."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <label className="block text-sm font-semibold">
        Họ và tên<RequiredMark />
        <input required autoComplete="name" value={input.name} onChange={(event) => setField("name", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "sign-up-name-error" : undefined} />
        {errors.name && <span id="sign-up-name-error" className="mt-1 block text-xs text-[#EF5350]">{errors.name}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Email<RequiredMark />
        <input required type="email" autoComplete="email" value={input.email} onChange={(event) => setField("email", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "sign-up-email-error" : undefined} />
        {errors.email && <span id="sign-up-email-error" className="mt-1 block text-xs text-[#EF5350]">{errors.email}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Số điện thoại<RequiredMark />
        <input required type="tel" autoComplete="tel" value={input.phone} onChange={(event) => setField("phone", event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "sign-up-phone-error" : undefined} />
        {errors.phone && <span id="sign-up-phone-error" className="mt-1 block text-xs text-[#EF5350]">{errors.phone}</span>}
      </label>
      <label className="block text-sm font-semibold">
        Địa chỉ <span className="font-normal text-[#9ca3af]">(không bắt buộc)</span>
        <input autoComplete="street-address" value={input.address} onChange={(event) => setField("address", event.target.value)} className={fieldClass} />
      </label>

      <div>
        <label htmlFor="sign-up-password" className="text-sm font-semibold">Mật khẩu<RequiredMark /></label>
        <div className="relative">
          <input id="sign-up-password" required type={showPassword ? "text" : "password"} autoComplete="new-password" value={input.password} onChange={(event) => setField("password", event.target.value)} className={`${fieldClass} pr-12`} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "sign-up-password-error" : undefined} />
          <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-[#6b7280]">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <span id="sign-up-password-error" className="mt-1 block text-xs text-[#EF5350]">{errors.password}</span>}
      </div>

      <div>
        <label htmlFor="sign-up-confirm-password" className="text-sm font-semibold">Xác nhận mật khẩu<RequiredMark /></label>
        <div className="relative">
          <input id="sign-up-confirm-password" required type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={input.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} className={`${fieldClass} pr-12`} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "sign-up-confirm-password-error" : undefined} />
          <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"} className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-[#6b7280]">
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <span id="sign-up-confirm-password-error" className="mt-1 block text-xs text-[#EF5350]">{errors.confirmPassword}</span>}
      </div>

      <label className="flex items-start gap-2 text-xs leading-5 text-[#6b7280]">
        <input required aria-required="true" type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); if (event.target.checked) setFormError(""); }} className="mt-1 size-4 accent-[#4F8F68]" />
        <span>Tôi đồng ý với <Link href="/terms" className="font-semibold text-[#4F8F68]">Điều khoản</Link> và <Link href="/privacy" className="font-semibold text-[#4F8F68]">Chính sách bảo mật</Link>.<RequiredMark /></span>
      </label>
      {formError && <p role="alert" className="text-sm text-[#EF5350]">{formError}</p>}
      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F8F68] text-sm font-semibold text-white disabled:opacity-60">
        {loading && <LoaderCircle size={17} className="animate-spin" />}
        {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>
      <p className="pt-3 text-center text-sm text-[#6b7280]">Đã có tài khoản? <Link href="/sign-in" className="font-semibold text-[#4F8F68]">Đăng nhập</Link></p>
    </form>
  );
}
