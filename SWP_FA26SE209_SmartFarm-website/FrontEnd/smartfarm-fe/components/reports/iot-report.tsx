"use client";

import { LoadingState } from "@/components/ui/loading-state";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { ActuatorLog, IoTDevice, Paged } from "@/lib/api/staff/staff-iot-service";
import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import type { SoilTray } from "@/lib/api/staff/staff-farm-service";
import { staffTelemetryService } from "@/lib/api/staff/staff-telemetry-instance";
import type { StaffTelemetryHistory, StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";
import { EnvironmentMetricsChart } from "@/components/my-trays/environment-metrics-chart";
import { useReports } from "./reports-provider";

const stamp = (value: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "—";

export function IoTReport() {
  const { from, to } = useReports();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [trayId, setTrayId] = useState("");
  const [page, setPage] = useState(1);
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [logs, setLogs] = useState<Paged<ActuatorLog> | null>(null);
  const [telemetry, setTelemetry] = useState<StaffTelemetryHistory | null>(null);
  const [latest, setLatest] = useState<StaffTelemetryReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([staffIoTService.devices({ page: 1, pageSize: 100 }), adminFarmService.trays()]).then(([result, farmTrays]) => {
      if (active) { setDevices(result.items); setTrays(farmTrays); }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải thiết bị hoặc khay."); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    let active = true;
    const id = window.setTimeout(() => {
      setLoading(true); setError("");
      const selectedId = deviceId ? Number(deviceId) : undefined;
      void Promise.all([
        staffIoTService.logs({ deviceId: selectedId, from: from ? new Date(`${from}T00:00:00`) : undefined, to: to ? new Date(`${to}T23:59:59.999`) : undefined, page, pageSize: 20 }),
        selectedId ? staffIoTService.latestTelemetry(selectedId).catch(() => null) : Promise.resolve(null),
      ]).then(([result, reading]) => { if (active) { setLogs(result); setLatest(reading); } })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải nhật ký IoT."); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(id); };
  }, [deviceId, from, to, page, reload]);

  useEffect(() => {
    if (!trayId) return;
    let active = true;
    const id = window.setTimeout(() => {
      setTelemetry(null);
      void staffTelemetryService.history(Number(trayId), {
        from: from ? new Date(`${from}T00:00:00`) : undefined,
        to: to ? new Date(`${to}T23:59:59.999`) : undefined,
        page: telemetryPage, pageSize: 20,
      }).then((result) => { if (active) setTelemetry(result); })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không thể tải lịch sử cảm biến."); });
    }, 0);
    return () => { active = false; window.clearTimeout(id); };
  }, [trayId, from, to, telemetryPage, reload]);

  const selectedDevice = devices.find((item) => String(item.deviceId) === deviceId);
  return <div className="space-y-5 p-5 sm:p-6">
    <div className="flex flex-wrap items-center gap-3"><label className="text-sm font-medium">Thiết bị <select className="ml-2 rounded-lg border bg-white px-3 py-2" value={deviceId} onChange={(event) => { setDeviceId(event.target.value); setPage(1); }}><option value="">Tất cả thiết bị</option>{devices.map((item) => <option key={item.deviceId} value={item.deviceId}>{item.deviceCode}</option>)}</select></label><label className="text-sm font-medium">Khay <select className="ml-2 rounded-lg border bg-white px-3 py-2" value={trayId} onChange={(event) => { setTrayId(event.target.value); setTelemetryPage(1); setTelemetry(null); }}><option value="">Chọn khay xem lịch sử</option>{trays.map((item) => <option key={item.soilTrayId} value={item.soilTrayId}>{item.trayCode}</option>)}</select></label><Button variant="outline" onClick={() => setReload((value) => value + 1)} disabled={loading}>Làm mới</Button></div>
    {selectedDevice && <section className="rounded-xl border bg-[#F7FAF8] p-4 text-sm"><h3 className="font-semibold">Số đo mới nhất · {selectedDevice.deviceCode}</h3>{latest ? <p className="mt-2 text-muted-foreground">{stamp(latest.recordedAt)} · Nhiệt độ {latest.temperature ?? "—"}°C · Ẩm không khí {latest.airHumidity ?? "—"}% · Ẩm đất {latest.soilHumidity ?? "—"}% · Ánh sáng {latest.lightIntensity ?? "—"} lux · Mực nước {latest.waterLevel ?? "—"}%{latest.isStale ? " · Dữ liệu cũ" : ""}</p> : <p className="mt-2 text-muted-foreground">Thiết bị chưa có số đo.</p>}</section>}
    {trayId && telemetry && <EnvironmentMetricsChart readings={[...telemetry.items].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())} />}
    {trayId && <section className="overflow-x-auto rounded-xl border"><h3 className="border-b px-4 py-3 font-semibold">Lịch sử cảm biến · {trays.find((item) => String(item.soilTrayId) === trayId)?.trayCode || `Khay #${trayId}`}</h3><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#F7FAF8]"><tr>{["Thời gian", "Thiết bị", "Nhiệt độ", "Ẩm không khí", "Ẩm đất", "Ánh sáng", "Mực nước"].map((label) => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{telemetry?.items.map((item) => <tr className="border-t" key={item.telemetryId}><td className="px-4 py-3">{stamp(item.recordedAt)}</td><td className="px-4 py-3">{item.deviceCode}</td><td className="px-4 py-3">{item.temperature ?? "—"}</td><td className="px-4 py-3">{item.airHumidity ?? "—"}</td><td className="px-4 py-3">{item.soilHumidity ?? "—"}</td><td className="px-4 py-3">{item.lightIntensity ?? "—"}</td><td className="px-4 py-3">{item.waterLevel ?? "—"}</td></tr>)}</tbody></table>{telemetry && !telemetry.items.length && <p className="border-t p-6 text-sm text-muted-foreground">Chưa có số đo trong khoảng thời gian đã chọn.</p>}{telemetry && telemetry.totalPages > 1 && <div className="flex items-center justify-end gap-3 border-t p-3"><Button variant="outline" disabled={telemetryPage <= 1} onClick={() => setTelemetryPage((value) => value - 1)}>Trước</Button><span className="text-sm">{telemetryPage} / {telemetry.totalPages}</span><Button variant="outline" disabled={telemetryPage >= telemetry.totalPages} onClick={() => setTelemetryPage((value) => value + 1)}>Sau</Button></div>}</section>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading && <LoadingState label="Đang tải nhật ký IoT..." />}
    {!loading && !error && <section className="overflow-x-auto rounded-xl border"><h3 className="border-b px-4 py-3 font-semibold">Nhật ký lệnh điều khiển</h3><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#F7FAF8]"><tr>{["Thời gian", "Thiết bị", "Nguồn", "Lệnh", "Kết quả"].map((label) => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{logs?.items.map((item) => <tr className="border-t" key={item.logId}><td className="px-4 py-3">{stamp(item.requestedAt)}</td><td className="px-4 py-3">{devices.find((device) => device.deviceId === item.deviceId)?.deviceCode || `#${item.deviceId}`}</td><td className="px-4 py-3">{item.triggeredBy}</td><td className="px-4 py-3">{item.actuatorType} · {item.action}</td><td className="px-4 py-3">{item.result}{item.failureReason ? ` · ${item.failureReason}` : ""}</td></tr>)}</tbody></table>{!logs?.items.length && <p className="border-t p-6 text-sm text-muted-foreground">Không có lệnh trong khoảng thời gian đã chọn.</p>}</section>}
    {logs && logs.totalPages > 1 && <div className="flex items-center justify-end gap-3"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span className="text-sm">{page} / {logs.totalPages}</span><Button variant="outline" disabled={loading || page >= logs.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></div>}
  </div>;
}
