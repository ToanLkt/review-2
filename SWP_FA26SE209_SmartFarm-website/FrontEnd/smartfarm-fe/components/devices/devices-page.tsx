"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/loading-state";
import { useConfirmAction } from "@/components/ui/use-confirm-action";
import { Input } from "@/components/ui/input";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { ActuatorLog, ComponentType, IoTDevice, Paged, TrayDevice } from "@/lib/api/staff/staff-iot-service";
import { adminFarmService } from "@/lib/api/admin/admin-farm-instance";
import type { SoilTray } from "@/lib/api/staff/staff-farm-service";
import { dateTime } from "@/lib/formatters";
import { DeviceLatestTelemetry } from "@/components/devices/device-latest-telemetry";

type Actuator = "VENTILATION_FAN" | "LED_LIGHT" | "WATER_PUMP";
type Draft = { deviceCode: string; macAddress: string; deviceType: string; firmwareVersion: string; status: "OFFLINE" | "ONLINE" | "INACTIVE" };
const emptyDraft: Draft = { deviceCode: "", macAddress: "", deviceType: "ESP32", firmwareVersion: "", status: "OFFLINE" };
const actuatorComponents: Record<string, Actuator> = { VENTILATION_FAN: "VENTILATION_FAN", LED_LIGHT: "LED_LIGHT", WATER_PUMP: "WATER_PUMP" };
const componentNames: Record<Actuator, string> = { VENTILATION_FAN: "Quạt", LED_LIGHT: "Đèn", WATER_PUMP: "Bơm" };
const componentOptions: { value: ComponentType; label: string }[] = [
  { value: "SOIL_MOISTURE", label: "Độ ẩm đất" }, { value: "AIR_TEMP_HUMIDITY", label: "Nhiệt độ / độ ẩm không khí" },
  { value: "LIGHT", label: "Ánh sáng" }, { value: "WATER_PUMP", label: "Máy bơm" },
  { value: "LED_LIGHT", label: "Đèn" }, { value: "VENTILATION_FAN", label: "Quạt" },
];

async function allPages<T>(load: (page: number) => Promise<Paged<T>>) {
  const first = await load(1);
  const rows = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) rows.push(...(await load(page)).items);
  return rows;
}

export function DevicesPage() {
  const { confirm, confirmationDialog } = useConfirmAction();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [assignments, setAssignments] = useState<TrayDevice[]>([]);
  const [trays, setTrays] = useState<SoilTray[]>([]);
  const [logs, setLogs] = useState<ActuatorLog[]>([]);
  const [tab, setTab] = useState<"sensors" | "actuators" | "commands">("sensors");
  const [selected, setSelected] = useState<IoTDevice | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [assignment, setAssignment] = useState<{ soilTrayId: string; componentType: ComponentType; pinNumber: string }>({ soilTrayId: "", componentType: "SOIL_MOISTURE", pinNumber: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [nextDevices, nextAssignments, nextTrays, nextLogs] = await Promise.all([
        allPages((page) => staffIoTService.devices({ page, pageSize: 100 })),
        staffIoTService.trayDevices({ active: true }), adminFarmService.trays(),
        allPages((page) => staffIoTService.logs({ page, pageSize: 100 })),
      ]);
      setDevices(nextDevices); setAssignments(nextAssignments); setTrays(nextTrays); setLogs(nextLogs);
      setSelected((current) => current ? nextDevices.find((item) => item.deviceId === current.deviceId) ?? null : null);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải thiết bị IoT."); }
    finally { if (showLoading) setLoading(false); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(() => reload());
    const timer = window.setInterval(() => { void reload(false); }, 10_000);
    return () => window.clearInterval(timer);
  }, [reload]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!draft.deviceCode.trim() || !draft.deviceType.trim()) { setError("Nhập mã và loại thiết bị."); return; }
    setBusy(true);
    try {
      await staffIoTService.createDevice({ deviceCode: draft.deviceCode.trim(), macAddress: draft.macAddress.trim() || null,
        deviceType: draft.deviceType.trim(), firmwareVersion: draft.firmwareVersion.trim() || null, status: draft.status });
      setCreating(false); setDraft(emptyDraft); await reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể thêm thiết bị."); }
    finally { setBusy(false); }
  }

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!selected || !assignment.soilTrayId) { setError("Chọn khay để gán thiết bị."); return; }
    setBusy(true);
    try {
      await staffIoTService.assign({ deviceId: selected.deviceId, soilTrayId: Number(assignment.soilTrayId),
        componentType: assignment.componentType, pinNumber: assignment.pinNumber.trim() || null });
      setAssignment({ soilTrayId: "", componentType: "SOIL_MOISTURE", pinNumber: "" }); await reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể gán thiết bị."); }
    finally { setBusy(false); }
  }

  function send(device: IoTDevice, actuatorType: Actuator, action: "ON" | "OFF") {
    const verb = action === "ON" ? "bật" : "tắt";
    confirm({
      title: "Gửi lệnh điều khiển?",
      description: `Gửi lệnh ${verb} ${componentNames[actuatorType]} trên ${device.deviceCode}?`,
      actionLabel: "Gửi lệnh",
      variant: "default",
      onConfirm: async () => {
        setBusy(true);
        try { await staffIoTService.command(device.deviceId, { actuatorType, action }); await reload(false); }
        catch (reason) { const detail = reason instanceof Error ? reason.message : "Không thể gửi lệnh điều khiển."; setError(detail); throw reason; }
        finally { setBusy(false); }
      },
    });
  }

  const configured = (deviceId: number) => assignments.filter((item) => item.deviceId === deviceId);
  const hasActuator = (deviceId: number) => configured(deviceId).some((item) => item.componentType in actuatorComponents);
  const visible = devices.filter((device) => {
    const linked = configured(device.deviceId);
    return tab === "actuators"
      ? hasActuator(device.deviceId)
      : !linked.length || linked.some((item) => !(item.componentType in actuatorComponents));
  });

  return <main className="mx-auto w-full max-w-[1800px] space-y-6 bg-white px-4 py-10 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-[26px] font-bold">Thiết bị IoT</h1><p className="mt-2 text-muted-foreground">Theo dõi thiết bị, khay liên kết và lịch sử điều khiển.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => void reload()}><RefreshCw className="size-4" /> Làm mới</Button><Button onClick={() => { setCreating(true); setSelected(null); }}><Plus className="size-4" /> Thêm thiết bị</Button></div>
    </header>
    {loading && <div className="rounded-xl border"><TableSkeleton rows={6} columns={6} /></div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <nav className="flex flex-wrap gap-2" aria-label="Nhóm thiết bị">
      {([ ["sensors", "Cảm biến / chưa gán"], ["actuators", "Thiết bị điều khiển"], ["commands", "Nhật ký lệnh"] ] as const).map(([value, label]) =>
        <Button key={value} variant={tab === value ? "default" : "outline"} onClick={() => setTab(value)}>{label}</Button>)}
    </nav>
    {!loading && tab !== "commands" && <section className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-4">Mã thiết bị</th><th className="p-4">Loại</th><th className="p-4">Trạng thái</th><th className="p-4">Khay / thành phần</th><th className="p-4">Liên lạc cuối</th><th className="p-4">Thao tác</th></tr></thead><tbody>
      {visible.map((device) => <tr key={device.deviceId} className="border-t"><td className="p-4 font-medium">{device.deviceCode}</td><td className="p-4">{device.deviceType}</td><td className="p-4">{device.status}</td><td className="p-4">{configured(device.deviceId).map((item) => `${item.trayCode} · ${item.componentType}`).join(", ") || "Chưa gán"}</td><td className="p-4">{device.lastSeen ? dateTime(device.lastSeen) : "Chưa có"}</td><td className="p-4"><Button size="sm" variant="outline" onClick={() => { setSelected(device); setCreating(false); }}>Chi tiết</Button></td></tr>)}
      {!visible.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có thiết bị phù hợp.</td></tr>}
    </tbody></table></section>}
    {!loading && tab === "commands" && <section className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted"><tr><th className="p-4">Thiết bị</th><th className="p-4">Thành phần</th><th className="p-4">Lệnh</th><th className="p-4">Kết quả</th><th className="p-4">Thời điểm</th><th className="p-4">Chi tiết</th></tr></thead><tbody>
      {logs.map((log) => <tr key={log.logId} className="border-t"><td className="p-4">{devices.find((item) => item.deviceId === log.deviceId)?.deviceCode ?? log.deviceId}</td><td className="p-4">{log.actuatorType}</td><td className="p-4">{log.action}</td><td className="p-4">{log.result}</td><td className="p-4">{dateTime(log.requestedAt)}</td><td className="p-4">{log.failureReason ?? (log.commandId ? `ID: ${log.commandId}` : "—")}</td></tr>)}
      {!logs.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Chưa có lệnh điều khiển.</td></tr>}
    </tbody></table></section>}
    {creating && <section className="max-w-xl space-y-4 rounded-xl border p-5"><h2 className="text-lg font-semibold">Thêm thiết bị</h2><form className="space-y-3" onSubmit={(event) => void create(event)}>
      <label className="block text-sm">Mã thiết bị<Input value={draft.deviceCode} maxLength={100} onChange={(event) => setDraft({ ...draft, deviceCode: event.target.value })} /></label>
      <label className="block text-sm">Loại thiết bị<Input value={draft.deviceType} maxLength={50} onChange={(event) => setDraft({ ...draft, deviceType: event.target.value })} /></label>
      <label className="block text-sm">Địa chỉ MAC (tùy chọn)<Input value={draft.macAddress} maxLength={50} onChange={(event) => setDraft({ ...draft, macAddress: event.target.value })} /></label>
      <label className="block text-sm">Phiên bản thiết bị (tùy chọn)<Input value={draft.firmwareVersion} maxLength={50} onChange={(event) => setDraft({ ...draft, firmwareVersion: event.target.value })} /></label>
      <div className="flex gap-2"><Button disabled={busy} type="submit">Lưu thiết bị</Button><Button type="button" variant="outline" onClick={() => setCreating(false)}>Hủy</Button></div>
    </form></section>}
    {selected && <section className="space-y-5 rounded-xl border p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{selected.deviceCode}</h2><Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button></div>
      <p className="text-sm text-muted-foreground">ID {selected.deviceId} · {selected.deviceType} · {selected.status}</p>
      <DeviceLatestTelemetry key={selected.deviceId} deviceId={selected.deviceId} />
      <div><h3 className="mb-2 font-medium">Liên kết khay</h3>{configured(selected.deviceId).map((item) => <div key={item.trayDeviceId} className="flex flex-wrap items-center gap-3 py-2 text-sm"><span>{item.trayCode} · {item.componentType}{item.pinNumber ? ` · chân ${item.pinNumber}` : ""}</span><Button size="sm" variant="outline" disabled={busy} onClick={() => { void staffIoTService.unassign(item.trayDeviceId).then(() => reload()).catch((reason) => setError(reason instanceof Error ? reason.message : "Không thể bỏ gán.")); }}>Bỏ gán</Button></div>)}
        {!configured(selected.deviceId).length && <p className="text-sm text-muted-foreground">Chưa gán vào khay.</p>}
      </div>
      <form onSubmit={(event) => void assign(event)} className="flex flex-wrap items-end gap-2"><label className="text-sm">Khay<select className="block h-10 rounded-md border px-2" value={assignment.soilTrayId} onChange={(event) => setAssignment({ ...assignment, soilTrayId: event.target.value })}><option value="">Chọn khay</option>{trays.map((tray) => <option key={tray.soilTrayId} value={tray.soilTrayId}>{tray.trayCode}</option>)}</select></label>
        <label className="text-sm">Thành phần<select className="block h-10 rounded-md border px-2" value={assignment.componentType} onChange={(event) => setAssignment({ ...assignment, componentType: event.target.value as ComponentType })}>{componentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-sm">Chân (tùy chọn)<Input className="w-28" value={assignment.pinNumber} onChange={(event) => setAssignment({ ...assignment, pinNumber: event.target.value })} /></label><Button disabled={busy} type="submit">Gán khay</Button></form>
      {!!configured(selected.deviceId).filter((item) => item.componentType in actuatorComponents).length && <div className="space-y-3 border-t pt-4"><h3 className="font-medium">Điều khiển thiết bị</h3>
        {[...new Set(configured(selected.deviceId).map((item) => actuatorComponents[item.componentType]).filter((value): value is Actuator => !!value))].map((actuator) => <div key={actuator} className="flex items-center gap-2"><span className="min-w-16 text-sm">{componentNames[actuator]}</span><Button size="sm" disabled={busy || selected.status === "INACTIVE"} onClick={() => void send(selected, actuator, "ON")}>Bật</Button><Button size="sm" variant="outline" disabled={busy || selected.status === "INACTIVE"} onClick={() => void send(selected, actuator, "OFF")}>Tắt</Button></div>)}
        <p className="text-xs text-muted-foreground">Lệnh được gửi qua MQTT. Kết quả PENDING/SUCCESS/FAILED hiển thị trong Nhật ký lệnh.</p>
      </div>}
    </section>}
    {confirmationDialog}
  </main>;
}
