import type { Metadata } from "next";
import { SignInPage } from "@/components/auth/sign-in-page";

export const metadata: Metadata = {
  title: "Đăng nhập · SmartFarm",
  description: "Đăng nhập SmartFarm để quản lý khay rau mầm và công việc của bạn.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <SignInPage returnTo={returnTo} />;
}
