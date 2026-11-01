"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Droplets, Fan, Gauge, Lightbulb, Power, Sun, Thermometer, Waves } from "lucide-react";

import { ApiError, getAuthErrorMessage, telemetryService, type TelemetryReading } from "@/lib/api";
import { Breadcrumb } from "@/components/user/user-ui";
import { EnvironmentMetricsChart } from "@/components/my-trays/environment-metrics-chart";
import { CameraSnapshotsPanel } from "@/components/my-trays/camera-snapshots-panel";

const latestRefreshMs = 30_000;
const historyPageSize = 100;

function display(value: number | null | undefined) {
  return value === null || value === undefined ? "Chưa có dữ liệu" : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function dateTime(value: string | null | undefined) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có dữ liệu" : date.toLocaleString("vi-VN");
}

export function TrayDetailPage({ rentalId }: { rentalId: number }) {
  const [latest, setLatest] = useState<TelemetryReading | null>(null);
  const [history, setHistory] = useState<TelemetryReading[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [rangeVersion, setRangeVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let active = true;
    async function refreshLatest() {
      try {
        const reading = await telemetryService.getLatest(rentalId);
        if (active) {
          setLatest(reading);
          setNotFound(false);
          setError("");
        }
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setLatest(null);
          setNotFound(true);
        }
        else setError(getAuthErrorMessage(requestError, "Không thể tải chỉ số môi trường mới nhất."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void refreshLatest();
    const timer = window.setInterval(() => { void refreshLatest(); }, latestRefreshMs);
    return () => { active = false; window.clearInterval(timer); };
  }, [rentalId]);

  useEffect(() => {
    let active = true;
    void telemetryService.getHistory(rentalId, { page: historyPage, pageSize: historyPageSize, from: range.from, to: range.to })
      .then((result) => {
        if (!active) return;
        setHistory(result.items);
        setHistoryTotalPages(Math.max(1, result.totalPages));
      })
      .catch((requestError) => { if (active) setHistoryError(getAuthErrorMessage(requestError, "Không thể tải lịch sử chỉ số môi trường.")); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [historyPage, range.from, range.to, rangeVersion, rentalId]);

  function applyRange(event: FormEvent) {
    event.preventDefault();
    const from = fromInput ? new Date(fromInput) : undefined;
    const to = toInput ? new Date(toInput) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) {
      setHistoryError("Khoảng thời gian không hợp lệ.");
      return;
    }
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryPage(1);
    setRange({ from, to });
    setRangeVersion((value) => value + 1);
  }

  function changeHistoryPage(nextPage: number) {
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryPage(nextPage);
  }

  if (loading) return <main className="mx-auto max-w-5xl px-6 py-20 text-sm text-[#6b7280]">Đang tải thông tin khay...</main>;
  if (notFound) return <main className="mx-auto max-w-5xl px-6 py-20"><h1 className="text-2xl font-bold">Không tìm thấy dữ liệu của khay</h1><Link href="/my-trays" className="mt-4 inline-block text-sm font-semibold text-[#4F8F68]">Quay lại Khay của tôi</Link></main>;
  if (error && !latest) return <main className="mx-auto max-w-5xl px-6 py-20"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-[#EF5350]">{error}</p></main>;

  const metrics = [
    { label: "Nhiệt độ", value: latest?.temperature, icon: Thermometer, color: "text-amber-700 bg-amber-50" },
    { label: "Độ ẩm không khí", value: latest?.airHumidity, icon: Droplets, color: "text-blue-700 bg-blue-50" },
    { label: "Độ ẩm đất", value: latest?.soilHumidity, icon: Waves, color: "text-purple-700 bg-purple-50" },
    { label: "Cường độ sáng", value: latest?.lightIntensity, icon: Sun, color: "text-[#4F8F68] bg-[#E8F3EB]" },
    { label: "Mực nước", value: latest?.waterLevel, icon: Gauge, color: "text-cyan-700 bg-cyan-50" },
  ];
  const devices = [
    { label: "Quạt", value: latest?.fanState, icon: Fan },
    { label: "Đèn", value: latest?.ledState, icon: Lightbulb },
    { label: "Máy bơm", value: latest?.pumpState, icon: Power },
  ];

  return <main className="mx-auto max-w-7xl px-6 py-10"><Breadcrumb items={[{ label: "Khay của tôi", href: "/my-trays" }, { label: `Khay thuê #${rentalId}` }]} /><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Theo dõi khay #{rentalId}</h1><p className="mt-2 text-sm text-[#6b7280]">Thiết bị: {latest?.deviceCode ?? "Chưa có thông tin"} · Ghi nhận: {dateTime(latest?.recordedAt)}</p></div><p className="rounded-lg bg-[#f3f8f4] px-3 py-2 text-xs text-[#4F8F68]">Tự động cập nhật mỗi 30 giây</p></div>
    {latest?.isStale && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Dữ liệu cảm biến đã cũ. Các chỉ số bên dưới có thể chưa phản ánh trạng thái hiện tại.</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-[#e8f3eb] bg-white p-5"><span className={`flex size-10 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></span><p className="mt-4 text-xs text-[#6b7280]">{label}</p><p className="mt-1 text-xl font-bold">{display(value)}</p></div>)}</div>
    <section className="mt-6 rounded-2xl border border-[#e8f3eb] bg-white p-5"><h2 className="font-bold">Trạng thái thiết bị</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{devices.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-[#f3f8f4] p-4"><Icon size={18} className="text-[#4F8F68]" /><div><p className="text-xs text-[#6b7280]">{label}</p><p className="mt-1 text-sm font-semibold">{value === null || value === undefined ? "Chưa có dữ liệu" : value ? "Đang bật" : "Đang tắt"}</p></div></div>)}</div><p className="mt-3 text-xs text-[#6b7280]">Bạn chỉ có quyền theo dõi; việc điều khiển thiết bị do nhân viên SmartFarm thực hiện.</p></section>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-[#EF5350]">{error}</p>}
    <section className="mt-8"><form onSubmit={applyRange} className="mb-5 flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Từ<input type="datetime-local" value={fromInput} onChange={(event) => setFromInput(event.target.value)} className="mt-2 block h-11 rounded-xl border border-[#e8f3eb] px-3 text-sm" /></label><label className="text-sm font-semibold">Đến<input type="datetime-local" value={toInput} onChange={(event) => setToInput(event.target.value)} className="mt-2 block h-11 rounded-xl border border-[#e8f3eb] px-3 text-sm" /></label><button className="h-11 rounded-xl bg-[#4F8F68] px-5 text-sm font-semibold text-white">Áp dụng</button></form>{historyError ? <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-[#EF5350]">{historyError}</p> : historyLoading ? <div className="rounded-2xl border border-[#e8f3eb] p-12 text-center text-sm text-[#6b7280]">Đang tải lịch sử chỉ số môi trường...</div> : <EnvironmentMetricsChart readings={history} />}{!historyError && !historyLoading && historyTotalPages > 1 && <div className="mt-6 flex items-center justify-center gap-3"><button type="button" disabled={historyPage <= 1} onClick={() => changeHistoryPage(historyPage - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-[#6b7280]">Trang {historyPage}/{historyTotalPages}</span><button type="button" disabled={historyPage >= historyTotalPages} onClick={() => changeHistoryPage(historyPage + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Sau</button></div>}</section>
    <CameraSnapshotsPanel rentalId={rentalId} />
    <Link href="/my-trays" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280]"><ArrowLeft size={16} />Quay lại</Link>
  </main>;
}
