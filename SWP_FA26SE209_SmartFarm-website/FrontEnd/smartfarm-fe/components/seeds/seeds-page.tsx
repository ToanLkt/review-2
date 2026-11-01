"use client";

import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, Search, Sprout } from "lucide-react";

import { PageHeader } from "@/components/user/user-ui";
import { SeedCard } from "@/components/user/seed-card";
import { getAuthErrorMessage, seedService, type PagedResult, type SeedVariety } from "@/lib/api";

const pageSize = 9;

export function SeedsPage({
  basePath = "/seeds",
  title = "Giống rau mầm",
}: {
  basePath?: "/seeds" | "/seed-varieties";
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<SeedVariety> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void seedService.getSeedVarieties({ search: query, page, pageSize })
        .then((data) => {
          if (active) setResult(data);
        })
        .catch((requestError) => {
          if (active) setError(getAuthErrorMessage(requestError, "Không thể tải danh sách giống cây."));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, query]);

  const items = result?.items ?? [];
  return (
    <div className="min-h-screen bg-[#f3f8f4]">
      <div className="border-b border-[#e8f3eb] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <PageHeader title={title} subtitle="Chọn giống rau mầm cho khay thuê SmartFarm." />
          <label className="relative block max-w-2xl"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm kiếm giống cây..." aria-label="Tìm kiếm giống cây" className="h-12 w-full rounded-xl border border-[#e8f3eb] bg-[#f3f8f4] pl-11 pr-4 text-sm outline-none focus:border-[#4F8F68]" /></label>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-20 text-sm text-[#6b7280]"><LoaderCircle size={19} className="animate-spin" />Đang tải giống cây...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white px-6 py-16 text-center text-[#b91c1c]"><CircleAlert size={34} className="mx-auto" /><p className="mt-3 text-sm">{error}</p></div>
        ) : items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((seed) => <SeedCard key={seed.seedVarietyId} seed={seed} basePath={basePath} />)}</div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-20 text-center"><Sprout size={36} className="mx-auto text-[#4F8F68]" /><h2 className="mt-4 text-lg font-bold">Không tìm thấy giống cây phù hợp</h2><p className="mt-2 text-sm text-[#6b7280]">Thử từ khóa khác.</p></div>
        )}

        {!loading && !error && (result?.totalPages ?? 0) > 1 && (
          <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Phân trang giống cây">
            {Array.from({ length: result?.totalPages ?? 0 }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold ${pageNumber === page ? "bg-[#4F8F68] text-white" : "border border-[#e8f3eb] bg-white text-[#6b7280]"}`}>{pageNumber}</button>)}
          </nav>
        )}
      </div>
    </div>
  );
}
