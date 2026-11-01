"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, ClipboardList, PackageCheck, Search, Sprout, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Choice } from "@/components/operations/shared/ui";
import { DevicePagination } from "@/components/devices/device-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  dateMatches,
  rentalSteps,
  seedSteps,
} from "@/lib/orders";
import { normalized } from "@/lib/pricing";
import { useOrders } from "./orders-provider";
import { OrderTable } from "./orders-table";
const OrderDetail = dynamic(
  () => import("./order-detail").then((m) => m.OrderDetail),
  {
    loading: () => (
      <div
        role="status"
        aria-label="Đang tải chi tiết đơn hàng"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[900px] space-y-6 border-l bg-white p-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);
export function OrdersPage() {
  const { orders, state } = useOrders(),
    params = useSearchParams(),
    router = useRouter();
  const tab =
    params.get("tab") === "rental"
      ? "rental"
      : params.get("tab") === "retail"
        ? "retail"
        : "all";
  const selected = params.get("order"),
    [query, setQuery] = useState(""),
    [period, setPeriod] = useState(""),
    [payment, setPayment] = useState(""),
    [processing, setProcessing] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1);
  const trigger = useRef<HTMLElement | null>(null),
    heading = useRef<HTMLHeadingElement | null>(null);
  function url(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push("/admin/orders?" + next, { scroll: false });
  }
  function open(id: string) {
    trigger.current = document.activeElement as HTMLElement;
    url("order", id);
  }
  function reset() {
    setQuery("");
    setPeriod("");
    setPayment("");
    setProcessing("");
    setFrom("");
    setTo("");
    setPage(1);
  }
  const filtered = orders.filter(
    (o) =>
      (tab === "all" || o.kind === tab) &&
      normalized(
        o.id + " " + o.customer + " " + state.records[o.id].phone,
      ).includes(normalized(query)) &&
      (!payment || o.payment === payment) &&
      (!processing || state.records[o.id].processing === processing) &&
      dateMatches(o.created, period, from, to),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const metrics = [
    {
      value: orders.filter(
        (o) => state.records[o.id].processing === "Chờ xử lý",
      ).length,
      label: "Chờ xử lý",
      support: "Đơn cần tiếp nhận",
      icon: ClipboardList,
      color: "text-amber-700 bg-amber-50",
    },
    {
      value: orders.filter(
        (o) =>
          o.kind === "rental" &&
          ["Đang trồng", "Cấp phát khay"].includes(
            state.records[o.id].processing,
          ),
      ).length,
      label: "Đơn thuê khay",
      support: "Đang cấp phát hoặc trồng",
      icon: Sprout,
      color: "text-emerald-700 bg-emerald-50",
    },
    {
      value: orders.filter((o) => o.kind === "retail").length,
      label: "Đơn mua hạt giống",
      support: "Tổng đơn đã ghi nhận",
      icon: PackageCheck,
      color: "text-sky-700 bg-sky-50",
    },
    {
      value: orders.filter((o) =>
        ["Đã bàn giao vận chuyển", "Đang giao hàng"].includes(
          state.records[o.id].delivery,
        ),
      ).length,
      label: "Đang vận chuyển",
      support: "Chờ xác nhận giao hàng",
      icon: Truck,
      color: "text-violet-700 bg-violet-50",
    },
  ];
  const tabCounts = {
    all: orders.length,
    rental: orders.filter((o) => o.kind === "rental").length,
    retail: orders.filter((o) => o.kind === "retail").length,
  };
  const hasFilters = Boolean(query || period || payment || processing);
  return (
    <main className="w-full min-w-0 flex-1 bg-[#F7FAF8]">
      <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Kinh doanh / Quản lý đơn</p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-[#173B29]"
          >
            Đơn hàng
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Theo dõi tiến độ, thanh toán và lịch giao của từng đơn hàng.
          </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DCEBE1] bg-white px-4 py-2 text-sm font-medium text-[#436553]">
            <span className="size-2 rounded-full bg-primary" />
            {orders.length} đơn hàng trong hệ thống
          </span>
        </header>
        <section
          aria-label="Tổng hợp toàn bộ đơn hàng"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((m) => {
            const Icon = m.icon;
            return <div key={m.label} className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-[0_4px_18px_#244a3008]">
              <div className="flex items-start justify-between gap-3"><span className={`flex size-10 items-center justify-center rounded-xl ${m.color}`}><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-[#A8BBAF]" /></div>
              <p className="mt-5 text-3xl font-bold tabular-nums text-[#173B29]">{m.value}</p>
              <h2 className="mt-1 text-sm font-semibold text-[#243B2C]">{m.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{m.support}</p>
            </div>;
          })}
        </section>
        <section
          aria-label="Danh sách đơn hàng"
          className="min-w-0 overflow-hidden rounded-2xl border border-[#E1ECE4] bg-white shadow-[0_8px_30px_#244a3008]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
            <div><h2 className="text-lg font-bold text-[#173B29]">Danh sách đơn hàng</h2><p className="mt-1 text-xs text-muted-foreground">Chọn một đơn để xem thông tin và cập nhật tiến độ.</p></div>
            <p role="status" className="rounded-full bg-[#F1F7F2] px-3 py-1.5 text-xs font-semibold text-[#436553]">Hiển thị {filtered.length} / {orders.length} đơn</p>
          </div>
          <Tabs
            value={tab}
            onValueChange={(v) => {
              url("tab", v);
              setProcessing("");
              setPage(1);
            }}
            className="gap-0"
          >
            <div className="overflow-x-auto border-b px-5 pt-3 sm:px-6">
              <TabsList variant="line" className="h-12! gap-0 rounded-none p-0">
                {([
                  ["all", "Tất cả"],
                  ["rental", "Thuê khay"],
                  ["retail", "Mua hạt giống"],
                ] as const).map(([v, l]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="h-12 rounded-none px-4 after:bottom-0! after:bg-primary data-[state=active]:text-primary"
                  >
                    {l} <span className="ml-1 rounded-full bg-[#F1F7F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#55715F]">{tabCounts[v]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3 border-b border-[#EDF2EE] p-5 sm:px-6">
            <div className="relative w-full sm:min-w-64 sm:flex-1">
              <Search className="absolute top-2.5 left-3 size-4 text-[#8BAF9A]" />
              <Input
                aria-label="Tìm đơn hàng"
                placeholder="Tìm mã đơn, khách hàng hoặc số điện thoại"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border-[#DCEBE1] bg-[#FBFDFC] pl-9 shadow-none"
              />
            </div>
            {[
              {
                label: "Lọc ngày tạo",
                value: period,
                set: setPeriod,
                options: [
                  ["", "Tất cả ngày"],
                  ["today", "Hôm nay"],
                  ["7", "7 ngày qua"],
                  ["30", "30 ngày qua"],
                  ["custom", "Khoảng thời gian"],
                ],
              },
              {
                label: "Lọc thanh toán",
                value: payment,
                set: setPayment,
                options: [
                  "",
                  "Chờ thanh toán",
                  "Đã xác nhận",
                  "Thanh toán thất bại",
                  "Đã hoàn tiền",
                ].map((s) => [s, s || "Tất cả thanh toán"]),
              },
            ].map((f) => (
              <div key={f.label} className="w-full sm:w-44">
                <Choice
                  label={f.label}
                  value={f.value}
                  onChange={(v) => {
                    f.set(v);
                    setPage(1);
                  }}
                  options={f.options.map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>
            ))}
            {tab !== "all" && (
              <div className="w-full sm:w-52">
                <Choice
                  label="Lọc trạng thái xử lý"
                  value={processing}
                  onChange={(v) => {
                    setProcessing(v);
                    setPage(1);
                  }}
                  options={[
                    "",
                    ...(tab === "rental" ? rentalSteps : seedSteps),
                    "Đã hủy",
                  ].map((s) => ({
                    value: s,
                    label: s || "Tất cả trạng thái xử lý",
                  }))}
                />
              </div>
            )}
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={reset}
                className="text-xs text-primary"
              >
                Xóa lọc
              </Button>
            )}
            {period === "custom" && (
              <div className="flex w-full flex-wrap items-center gap-3">
                <label className="space-y-1 text-xs">
                  Từ ngày
                  <Input
                    type="date"
                    aria-label="Từ ngày"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  Đến ngày
                  <Input
                    type="date"
                    aria-label="Đến ngày"
                    value={to}
                    min={from}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                {(!from || !to || from > to) && (
                  <p role="alert" className="text-xs text-amber-700">
                    Chọn đủ ngày bắt đầu và kết thúc hợp lệ.
                  </p>
                )}
              </div>
            )}
          </div>
          <OrderTable
            orders={filtered.slice((current - 1) * 10, current * 10)}
            records={state.records}
            open={open}
            reset={reset}
            hasOrders={orders.length > 0}
          />
          <DevicePagination
            total={filtered.length}
            page={current}
            onPage={setPage}
          />
        </section>
      </div>
      {selected && orders.some((o) => o.id === selected) && (
        <OrderDetail
          id={selected}
          onClose={() => url("order", "")}
          returnFocus={() => {
            if (trigger.current?.isConnected) trigger.current.focus();
            else heading.current?.focus();
          }}
        />
      )}
      {selected && !orders.some((o) => o.id === selected) && (
        <div role="alert" className="mx-8 mb-8 rounded-xl border p-4 text-sm">
          Không tìm thấy đơn hàng {selected}.{" "}
          <Button variant="ghost" onClick={() => url("order", "")}>
            Quay lại danh sách
          </Button>
        </div>
      )}
    </main>
  );
}
