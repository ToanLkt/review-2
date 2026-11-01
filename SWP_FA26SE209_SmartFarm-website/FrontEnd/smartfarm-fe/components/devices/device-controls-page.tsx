"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Cpu, Droplets, Fan, Lightbulb, Power, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { ActuatorLog, IoTDevice } from "@/lib/api/staff/staff-iot-service";
import type { StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";
import { controlsForDevice, type ControlKind } from "@/lib/devices/control-preview";

const icons = { fan: Fan, light: Lightbulb, pump: Droplets };
const actuators = { fan: "VENTILATION_FAN", light: "LED_LIGHT", pump: "WATER_PUMP" } as const;
const activeButtonStyle = { backgroundColor: "#176A47", borderColor: "#176A47", color: "#FFFFFF", opacity: 1 };
type Commands = Partial<Record<ControlKind, ActuatorLog>>;

function kindFromActuator(value: string): ControlKind | null {
  if (value === "VENTILATION_FAN" || value === "FAN") return "fan";
  if (value === "LED_LIGHT" || value === "LED") return "light";
  if (value === "WATER_PUMP" || value === "PUMP") return "pump";
  return null;
}

function commandError(reason: unknown) {
  if (reason instanceof ApiError && reason.status === 409) return "Thiết bị đã ngừng sử dụng và không thể nhận lệnh.";
  if (reason instanceof ApiError && reason.status === 503) return "Không gửi được lệnh. Vui lòng kiểm tra kết nối và thử lại.";
  return reason instanceof Error ? reason.message : "Không gửi được lệnh điều khiển.";
}

function commandLabel(command?: ActuatorLog) {
  if (!command) return "Chưa có lệnh";
  if (command.result === "PENDING") return "Đang chờ xác nhận";
  if (command.result === "FAILED") return "Lệnh thất bại";
  return command.action === "ON" ? "Lệnh bật đã xác nhận" : "Lệnh tắt đã xác nhận";
}

function displayedState(kind: ControlKind, reading: StaffTelemetryReading | null, confirmed?: ActuatorLog): boolean | null {
  const reported = kind === "fan" ? reading?.fanState : kind === "light" ? reading?.ledState : reading?.pumpState;
  if (reading && !reading.isStale && reported != null && (!confirmed || Date.parse(reading.recordedAt) >= Date.parse(confirmed.requestedAt))) return reported;
  return confirmed ? confirmed.action === "ON" : null;
}

export function DeviceControlsPage({ deviceId, basePath }: { deviceId: number; basePath: "/staff/devices" | "/admin/devices" }) {
  const [device, setDevice] = useState<IoTDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [commands, setCommands] = useState<Commands>({});
  const [confirmed, setConfirmed] = useState<Commands>({});
  const [reading, setReading] = useState<StaffTelemetryReading | null>(null);
  const [sending, setSending] = useState<ControlKind | null>(null);
  const [commandErrors, setCommandErrors] = useState<Partial<Record<ControlKind, string>>>({});
  const [pollTimedOut, setPollTimedOut] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([staffIoTService.device(deviceId), staffIoTService.logs({ deviceId, pageSize: 100 })])
      .then(([deviceResult, logsResult]) => {
        if (!active) return;
        if (deviceResult.status === "fulfilled") setDevice(deviceResult.value);
        else setError(commandError(deviceResult.reason));
        if (logsResult.status === "fulfilled") {
          const latest: Commands = {};
          const lastConfirmed: Commands = {};
          for (const log of logsResult.value.items) {
            const kind = kindFromActuator(log.actuatorType);
            if (kind) {
              if (!latest[kind]) latest[kind] = log;
              if (log.result === "SUCCESS" && !lastConfirmed[kind]) lastConfirmed[kind] = log;
            }
          }
          setCommands(latest);
          setConfirmed(lastConfirmed);
        } else setHistoryError("Chưa tải được trạng thái các lệnh gần đây.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [deviceId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const latest = await staffIoTService.latestTelemetry(deviceId);
        if (active) setReading(latest);
      } catch {
        if (active) setReading(null);
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [deviceId]);

  const pendingIds = Object.values(commands)
    .filter((command) => command.result === "PENDING" && command.commandId)
    .map((command) => command.commandId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!pendingIds) return;
    let active = true;
    let checking = false;
    const started = Date.now();
    const timer = window.setInterval(async () => {
      if (!active || checking) return;
      if (Date.now() - started >= 30000) {
        setPollTimedOut(true);
        window.clearInterval(timer);
        return;
      }
      checking = true;
      try {
        const results = await Promise.allSettled(pendingIds.split(",").map((id) => staffIoTService.commandStatus(id)));
        if (!active) return;
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          const updated = result.value;
          const kind = kindFromActuator(updated.actuatorType);
          if (kind) {
            setCommands((current) => current[kind]?.commandId === updated.commandId ? { ...current, [kind]: updated } : current);
            if (updated.result === "SUCCESS") setConfirmed((current) => ({ ...current, [kind]: updated }));
          }
        }
      } finally { checking = false; }
    }, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [pendingIds]);

  async function refreshCommand(kind: ControlKind) {
    const commandId = commands[kind]?.commandId;
    if (!commandId) return;
    setCommandErrors((current) => ({ ...current, [kind]: "" }));
    try {
      const updated = await staffIoTService.commandStatus(commandId);
      setCommands((current) => current[kind]?.commandId === commandId ? { ...current, [kind]: updated } : current);
      if (updated.result === "SUCCESS") setConfirmed((current) => ({ ...current, [kind]: updated }));
      if (updated.result !== "PENDING") setPollTimedOut(false);
    } catch (reason) {
      setCommandErrors((current) => ({ ...current, [kind]: commandError(reason) }));
    }
  }

  async function sendCommand(kind: ControlKind, action: "ON" | "OFF") {
    if (sending || commands[kind]?.result === "PENDING" || device?.status === "INACTIVE") return;
    setSending(kind);
    setCommandErrors((current) => ({ ...current, [kind]: "" }));
    setPollTimedOut(false);
    try {
      const log = await staffIoTService.command(deviceId, { actuatorType: actuators[kind], action });
      setCommands((current) => ({ ...current, [kind]: log }));
    } catch (reason) {
      setCommandErrors((current) => ({ ...current, [kind]: commandError(reason) }));
    } finally {
      setSending(null);
    }
  }

  const available = device ? controlsForDevice(device.deviceType) : [];

  return <main className="min-h-[calc(100dvh-80px)] bg-[#F7FAF8] px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <Link href={basePath} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Thiết bị IoT</Link>
      {loading ? <div className="space-y-5" role="status" aria-label="Đang tải thiết bị"><Skeleton className="h-32 w-full rounded-2xl" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div></div>
      : error || !device ? <div className="rounded-2xl border border-red-100 bg-white p-8 text-center"><p className="font-semibold text-[#173B29]">Không thể mở thiết bị</p><p className="mt-2 text-sm text-muted-foreground">{error || "Không tìm thấy thiết bị đã chọn."}</p><Button asChild variant="outline" className="mt-5"><Link href={basePath}>Về danh sách thiết bị</Link></Button></div>
      : <>
        <header className="rounded-2xl border border-[#E1ECE4] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-primary"><Cpu className="size-7" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Điều khiển thiết bị</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#173B29] sm:text-3xl">{device.deviceCode}</h1><p className="mt-2 text-sm text-muted-foreground">{device.deviceType === "ESP32" ? "Bộ điều khiển" : device.deviceType}</p></div></div><Badge variant="outline" className={device.status === "ONLINE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{device.status === "ONLINE" ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}{device.status === "ONLINE" ? "Đang kết nối" : device.status === "INACTIVE" ? "Ngừng sử dụng" : "Mất kết nối"}</Badge></div>
        </header>
        <section className="space-y-4"><div><h2 className="text-xl font-bold text-[#173B29]">Thiết bị điều khiển</h2><p className="mt-1 text-sm text-muted-foreground">Gửi lệnh Bật hoặc Tắt và chờ thiết bị xác nhận. Nút màu xanh thể hiện trạng thái gần nhất được ghi nhận.</p></div>
          {historyError && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{historyError}</p>}
          {available.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{available.map((item) => {
            const Icon = icons[item.kind];
            const command = commands[item.kind];
            const pending = command?.result === "PENDING";
            const state = displayedState(item.kind, reading, confirmed[item.kind]);
            const isOn = state === true;
            const isOff = state === false;
            const disabled = !!sending || pending || device.status === "INACTIVE";
            const statusLabel = pending || command?.result === "FAILED" ? commandLabel(command) : isOn ? "Đang bật" : isOff ? "Đang tắt" : "Chưa rõ trạng thái";
            return <Card key={item.kind} className="rounded-2xl border-[#E1ECE4] bg-white shadow-sm"><CardContent className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><span className={`grid size-12 place-items-center rounded-xl ${isOn ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><Icon className="size-6" /></span><Badge variant="outline" className={pending ? "border-amber-200 bg-amber-50 text-amber-700" : isOn ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{statusLabel}</Badge></div><h3 className="mt-5 text-lg font-semibold text-[#173B29]">{item.name}</h3><p className="mt-1 min-h-10 text-sm text-muted-foreground">{item.description}</p><div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E8F0EA] pt-5"><Button type="button" variant="outline" className="bg-white text-[#173B29]" style={isOn ? activeButtonStyle : undefined} disabled={disabled} aria-label={`Bật ${item.name}`} aria-pressed={isOn} onClick={() => void sendCommand(item.kind, "ON")}><Power className="size-4" />{sending === item.kind ? "Đang gửi..." : "Bật"}</Button><Button type="button" variant="outline" className="bg-white text-[#173B29]" style={isOff ? activeButtonStyle : undefined} disabled={disabled} aria-label={`Tắt ${item.name}`} aria-pressed={isOff} onClick={() => void sendCommand(item.kind, "OFF")}>Tắt</Button></div>{pending && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-amber-700"><span>{pollTimedOut ? "Chưa nhận được xác nhận từ thiết bị." : "Lệnh đã gửi, đang chờ thiết bị xác nhận."}</span>{pollTimedOut && <Button type="button" size="sm" variant="outline" onClick={() => void refreshCommand(item.kind)}><RefreshCw className="size-3.5" />Kiểm tra lại</Button>}</div>}{command?.result === "FAILED" && <p className="mt-3 text-xs text-red-700" role="alert">Thiết bị không thực hiện được lệnh.</p>}{commandErrors[item.kind] && <p className="mt-3 text-xs text-red-700" role="alert">{commandErrors[item.kind]}</p>}</CardContent></Card>;
          })}</div> : <div className="rounded-2xl border border-dashed border-[#D7E5DA] bg-white px-6 py-14 text-center"><Cpu className="mx-auto size-9 text-[#8BAF9A]" /><h3 className="mt-3 font-semibold text-[#173B29]">Thiết bị này chưa có bộ phận điều khiển</h3><p className="mt-1 text-sm text-muted-foreground">Chọn một bộ điều khiển khác để xem quạt, đèn hoặc bơm.</p></div>}
        </section>
      </>}
    </div>
  </main>;
}
