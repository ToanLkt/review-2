"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, Droplets, Gauge, Package, Sun, Thermometer, Waves } from "lucide-react";

import { getAuthErrorMessage, rentalService, telemetryService, type TelemetryReading, type TrayRentalLine } from "@/lib/api";
import { PageHeader, StatusBadge } from "@/components/user/user-ui";
import { cropStatusLabel } from "@/lib/user-format";

const latestRefreshMs = 30_000;

function value(value: number | null | undefined) {
  return value === null || value === undefined ? "Chưa có dữ liệu" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function dateTime(value: string | null | undefined) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có dữ liệu" : date.toLocaleString("vi-VN");
}

function harvestProgress(rental: TrayRentalLine) {
  if (rental.actualHarvestDate) return `Đã thu hoạch: ${dateTime(rental.actualHarvestDate)}`;
  if (!rental.expectedHarvestDate) return "Chưa có lịch thu hoạch";
  const harvest = new Date(rental.expectedHarvestDate);
  if (Number.isNaN(harvest.getTime())) return "Chưa có lịch thu hoạch";
  const days = Math.ceil((harvest.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Đã qua ngày thu hoạch dự kiến";
  if (days === 0) return "Dự kiến thu hoạch hôm nay";
  return `Còn ${days} ngày đến thu hoạch`;
}

async function loadRentalLines() {
  const first = await rentalService.getRentals({ page: 1, pageSize: 100 });
  const pages = first.totalPages > 1
    ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => rentalService.getRentals({ page: index + 2, pageSize: 100 })))
    : [];
  return [first, ...pages].flatMap((page) => page.items.flatMap((order) => order.rentals ?? []));
}

export function MyTraysPage() {
  const [rentals, setRentals] = useState<TrayRentalLine[]>([]);
  const [latestByRental, setLatestByRental] = useState<Record<number, TelemetryReading | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    async function refreshLatest(lines: TrayRentalLine[]) {
      const results = await Promise.allSettled(lines.map((line) => telemetryService.getLatest(line.trayRentalId)));
      if (!active) return;
      const next: Record<number, TelemetryReading | null> = {};
      lines.forEach((line, index) => { next[line.trayRentalId] = results[index].status === "fulfilled" ? results[index].value : null; });
      setLatestByRental(next);
    }

    async function initialize() {
      try {
        const lines = await loadRentalLines();
        if (!active) return;
        setRentals(lines);
        await refreshLatest(lines);
        if (active) timer = window.setInterval(() => { void refreshLatest(lines); }, latestRefreshMs);
      } catch (requestError) {
        if (active) setError(getAuthErrorMessage(requestError, "Không thể tải khay đang thuê."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  const telemetryCount = Object.values(latestByRental).filter(Boolean).length;
  return <div className="mx-auto max-w-7xl px-6 py-10"><PageHeader title="Khay của tôi" subtitle="Theo dõi tình trạng khay và các chỉ số môi trường mới nhất." action={<Link href="/rent-tray" className="w-fit rounded-xl bg-[#4F8F68] px-5 py-3 text-sm font-semibold text-white">+ Thuê thêm khay</Link>} />
    <div className="mb-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#e8f3eb] bg-white p-5"><Package size={20} className="text-[#4F8F68]" /><p className="mt-4 text-xs text-[#6b7280]">Khay đang thuê</p><p className="mt-1 text-2xl font-bold">{rentals.length}</p></div><div className="rounded-2xl border border-[#e8f3eb] bg-white p-5"><Activity size={20} className="text-[#3B82F6]" /><p className="mt-4 text-xs text-[#6b7280]">Khay có dữ liệu mới</p><p className="mt-1 text-2xl font-bold">{telemetryCount}</p></div><div className="rounded-2xl border border-[#e8f3eb] bg-white p-5"><CalendarDays size={20} className="text-amber-700" /><p className="mt-4 text-xs text-[#6b7280]">Tự động cập nhật</p><p className="mt-1 text-2xl font-bold">30 giây</p></div></div>
    {error ? <div role="alert" className="rounded-2xl bg-red-50 p-6 text-sm text-[#EF5350]">{error}</div> : loading ? <div className="rounded-2xl border border-[#e8f3eb] p-14 text-center text-sm text-[#6b7280]">Đang tải thông tin khay...</div> : rentals.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dce9df] py-16 text-center"><Package size={36} className="mx-auto text-[#4F8F68]" /><h2 className="mt-4 font-bold">Chưa có khay thuê</h2><p className="mt-2 text-sm text-[#6b7280]">Các khay bạn thuê sẽ xuất hiện tại đây.</p></div> : <div className="grid gap-6 lg:grid-cols-2">{rentals.map((rental) => { const latest = latestByRental[rental.trayRentalId]; return <article key={rental.trayRentalId} className="rounded-2xl border border-[#e8f3eb] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-3"><strong className="font-mono">{rental.trayCode ?? `Khay #${rental.soilTrayId}`}</strong><StatusBadge tone="blue">{cropStatusLabel(rental.cropStatus)}</StatusBadge></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[
        { label: "Nhiệt độ", value: latest?.temperature, icon: Thermometer },
        { label: "Độ ẩm không khí", value: latest?.airHumidity, icon: Droplets },
        { label: "Độ ẩm đất", value: latest?.soilHumidity, icon: Waves },
        { label: "Cường độ sáng", value: latest?.lightIntensity, icon: Sun },
        { label: "Mực nước", value: latest?.waterLevel, icon: Gauge },
      ].map(({ label, value: sensorValue, icon: Icon }) => <div key={label} className="rounded-xl bg-[#f8fbf9] p-3"><Icon size={15} className="text-[#4F8F68]" /><p className="mt-2 text-[11px] text-[#6b7280]">{label}</p><p className="mt-1 font-bold">{value(sensorValue)}</p></div>)}</div><div className="mt-5 grid gap-2 border-t border-[#e8f3eb] pt-4 text-xs text-[#6b7280] sm:grid-cols-2"><span>Đợt trồng: <strong className="text-[#365b46]">{rental.currentCycle}/{rental.totalCycles}</strong></span><span>Cập nhật: {dateTime(latest?.recordedAt)}</span><span>Thu hoạch dự kiến: {dateTime(rental.expectedHarvestDate)}</span><span className="font-semibold text-[#4F8F68]">{harvestProgress(rental)}</span><Link href={`/my-trays/${rental.trayRentalId}`} className="inline-flex items-center gap-1 font-semibold text-[#4F8F68] sm:col-span-2">Xem chi tiết <ArrowRight size={13} /></Link></div></article>; })}</div>}
  </div>;
}
