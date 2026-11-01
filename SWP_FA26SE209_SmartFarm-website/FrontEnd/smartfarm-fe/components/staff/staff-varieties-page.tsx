"use client";

import { useMemo, useState } from "react";
import { Leaf, Search, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SeedStatus = "Còn hàng" | "Sắp hết" | "Hết hàng";
type SeedCategory = "Rau mầm" | "Rau lá" | "Rau thơm";

type StaffVariety = {
  code: string;
  name: string;
  category: SeedCategory;
  growthDays: number;
  stock: number;
  germinationRate: number;
  status: SeedStatus;
};

const varieties: StaffVariety[] = [
  { code: "GR-001", name: "Cải mầm", category: "Rau mầm", growthDays: 7, stock: 450, germinationRate: 95, status: "Còn hàng" },
  { code: "GR-002", name: "Củ cải đỏ", category: "Rau mầm", growthDays: 9, stock: 280, germinationRate: 92, status: "Còn hàng" },
  { code: "GR-003", name: "Hướng dương", category: "Rau mầm", growthDays: 12, stock: 120, germinationRate: 88, status: "Sắp hết" },
  { code: "GR-004", name: "Xà lách", category: "Rau lá", growthDays: 21, stock: 0, germinationRate: 90, status: "Hết hàng" },
  { code: "GR-005", name: "Húng quế", category: "Rau thơm", growthDays: 14, stock: 350, germinationRate: 87, status: "Còn hàng" },
  { code: "GR-006", name: "Cải thìa", category: "Rau lá", growthDays: 18, stock: 200, germinationRate: 91, status: "Còn hàng" },
  { code: "GR-007", name: "Đậu Hà Lan", category: "Rau mầm", growthDays: 10, stock: 80, germinationRate: 85, status: "Sắp hết" },
  { code: "GR-008", name: "Rau mầm hỗn hợp", category: "Rau mầm", growthDays: 8, stock: 500, germinationRate: 93, status: "Còn hàng" },
];

const statusClass: Record<SeedStatus, string> = {
  "Còn hàng": "border-0 bg-[#E8F3EB] text-[#3F7655]",
  "Sắp hết": "border-0 bg-amber-50 text-amber-700",
  "Hết hàng": "border-0 bg-red-50 text-red-600",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function StaffVarietiesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const visible = useMemo(() => {
    const search = normalize(query.trim());
    return varieties.filter(
      (variety) =>
        (category === "all" || variety.category === category) &&
        (status === "all" || variety.status === status) &&
        normalize(`${variety.name} ${variety.code}`).includes(search),
    );
  }, [category, query, status]);

  return (
    <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8]">
      <div className="mx-auto w-full max-w-[1700px] p-4 sm:p-6 lg:p-8">
        <header>
          <h1 className="text-[26px] font-bold tracking-tight text-[#1F2937]">
            Giống rau
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Danh mục giống rau và tình trạng kho hạt giống
          </p>
        </header>

        <section
          aria-label="Bộ lọc giống rau"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#E2E8E4] bg-white p-4 shadow-[0_1px_4px_rgba(36,74,48,0.03)] sm:flex-row sm:flex-wrap"
        >
          <div className="relative min-w-0 flex-1 sm:min-w-72">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8BAA97]" />
            <Input
              aria-label="Tìm giống rau"
              placeholder="Tìm giống rau..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 rounded-xl border-[#E2E8E4] bg-white pl-10 shadow-none"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              aria-label="Lọc theo danh mục"
              className="h-10 w-full rounded-xl border-[#E2E8E4] bg-white shadow-none sm:w-52"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              <SelectItem value="Rau mầm">Rau mầm</SelectItem>
              <SelectItem value="Rau lá">Rau lá</SelectItem>
              <SelectItem value="Rau thơm">Rau thơm</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              aria-label="Lọc theo trạng thái tồn kho"
              className="h-10 w-full rounded-xl border-[#E2E8E4] bg-white shadow-none sm:w-52"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Còn hàng">Còn hàng</SelectItem>
              <SelectItem value="Sắp hết">Sắp hết</SelectItem>
              <SelectItem value="Hết hàng">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {visible.length ? (
          <section
            aria-label="Danh sách giống rau"
            className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {visible.map((variety) => (
              <Card
                key={variety.code}
                className="gap-0 rounded-2xl border-[#E2E8E4] bg-white py-0 shadow-[0_2px_10px_rgba(31,41,55,0.035)]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#E8F3EB] text-[#4F8F68]">
                      <Leaf className="size-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-[#1F2937]">
                        {variety.name}
                      </h2>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        {variety.code} · {variety.category}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-3 border-y border-[#EDF1EE] py-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#6B7280]">Chu kỳ</dt>
                      <dd className="font-semibold text-[#1F2937]">
                        {variety.growthDays} ngày
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#6B7280]">Tồn kho</dt>
                      <dd className="font-semibold text-[#1F2937]">
                        {variety.stock} g
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#6B7280]">Tỷ lệ nảy mầm</dt>
                      <dd className="font-semibold text-[#1F2937]">
                        {variety.germinationRate}%
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                      <Sprout className="size-3.5 text-[#4F8F68]" />
                      Trạng thái kho
                    </span>
                    <Badge className={`px-2.5 py-1 ${statusClass[variety.status]}`}>
                      {variety.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-dashed border-[#E2E8E4] bg-white px-5 py-16 text-center">
            <Leaf className="mx-auto size-8 text-[#8BAA97]" />
            <h2 className="mt-4 text-sm font-semibold text-[#1F2937]">
              Không tìm thấy giống rau phù hợp
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Hãy thử từ khóa hoặc bộ lọc khác.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
