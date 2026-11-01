import type { Metadata } from "next";

import { ConfirmEmailPage } from "@/components/auth/confirm-email-page";

export const metadata: Metadata = {
  title: "Xác nhận email · SmartFarm",
  description: "Xác nhận email cho tài khoản Khách hàng SmartFarm.",
};

type ConfirmEmailSearchParams = Promise<{
  email?: string | string[];
  token?: string | string[];
  code?: string | string[];
  registered?: string | string[];
}>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ searchParams }: { searchParams: ConfirmEmailSearchParams }) {
  const params = await searchParams;
  return (
    <ConfirmEmailPage
      email={first(params.email)}
      token={first(params.token) ?? first(params.code)}
      registered={first(params.registered) === "1"}
    />
  );
}
