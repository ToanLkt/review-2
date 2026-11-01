"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, LoaderCircle, PackageOpen } from "lucide-react";

import { getAuthErrorMessage, seedService } from "@/lib/api";

export function CapacityPage({ detail = false }: { detail?: boolean }) {
  const [available, setAvailable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void seedService.getAvailableTrayOverview()
      .then(({ count }) => { if (active) setAvailable(count.available); })
      .catch((requestError) => { if (active) setError(getAuthErrorMessage(requestError, "Không thể tải số khay khả dụng.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">{detail ? "Thông tin khay khả dụng" : "Sức chứa khay khả dụng"}</h1>
      {loading ? <p className="mt-6 flex items-center gap-2 text-sm text-[#6b7280]"><LoaderCircle size={18} className="animate-spin" />Đang tải số lượng khay...</p> : error ? <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#b91c1c]"><CircleAlert size={18} />{error}</p> : <div className="mt-6 rounded-2xl border border-[#e8f3eb] bg-white p-6"><PackageOpen size={32} className="text-[#4F8F68]" /><p className="mt-4 text-sm text-[#6b7280]">Số khay hiện còn trống</p><p className="mt-2 text-4xl font-bold text-[#4F8F68]">{available ?? 0}</p><p className="mt-4 text-sm leading-6 text-[#6b7280]">Bạn có thể chọn số lượng và giống rau cho từng khay. Khay chỉ được giữ sau khi đơn thuê được xác nhận thành công.</p></div>}
      <Link href="/rent-tray" className="mt-6 inline-block rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3F7655]">Chọn giống và thuê khay</Link>
    </main>
  );
}
