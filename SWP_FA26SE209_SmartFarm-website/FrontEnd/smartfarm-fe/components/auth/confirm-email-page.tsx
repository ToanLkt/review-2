import { Leaf } from "lucide-react";

import { AuthBrandPanel } from "./auth-brand-panel";
import { ConfirmEmailForm } from "./confirm-email-form";

type ConfirmEmailPageProps = {
  email?: string;
  token?: string;
  registered?: boolean;
};

export function ConfirmEmailPage({ email, token, registered }: ConfirmEmailPageProps) {
  return <main className="grid min-h-screen bg-[#F3F8F4] text-[#1a2e1f] lg:grid-cols-2"><AuthBrandPanel /><div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10"><div className="w-full max-w-sm"><div className="mb-10 flex items-center gap-2.5 text-lg font-bold lg:hidden"><span className="flex size-9 items-center justify-center rounded-lg bg-[#4F8F68] text-white"><Leaf size={20} /></span>SmartFarm</div><div className="mb-8"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">BẢO MẬT TÀI KHOẢN</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Xác nhận email</h1><p className="mt-3 text-sm leading-6 text-[#6b7280]">Nhập mã trong email SmartFarm đã gửi cho bạn.</p></div><ConfirmEmailForm initialEmail={email} initialToken={token} registered={registered} /></div></div></main>;
}
