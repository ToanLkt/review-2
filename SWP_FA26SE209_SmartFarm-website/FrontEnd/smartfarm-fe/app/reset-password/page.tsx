import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/password-reset";

export const metadata: Metadata = {
  title: "Nhập mã OTP · SmartFarm",
  description: "Xác thực mã OTP và đặt lại mật khẩu SmartFarm.",
};

type ResetPasswordSearchParams = Promise<{
  email?: string | string[];
}>;

export default async function Page({ searchParams }: { searchParams: ResetPasswordSearchParams }) {
  const { email } = await searchParams;
  return <ResetPasswordForm initialEmail={Array.isArray(email) ? email[0] : email} />;
}
