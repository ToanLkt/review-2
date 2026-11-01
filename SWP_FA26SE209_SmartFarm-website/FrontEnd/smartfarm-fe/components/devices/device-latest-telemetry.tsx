"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { staffIoTService } from "@/lib/api/staff/staff-iot-instance";
import type { ActuatorLog } from "@/lib/api/staff/staff-iot-service";
import type { StaffTelemetryReading } from "@/lib/api/staff/staff-telemetry-service";
import { dateTime } from "@/lib/formatters";

type ActuatorType = "VENTILATION_FAN" | "LED_LIGHT" | "WATER_PUMP";
type ActuatorAction = "ON" | "OFF";

function stateLabel(value: boolean | null) {
  return value === null ? "Chưa có dữ liệu" : value ? "Bật" : "Tắt";
}

function telemetryAction(
  reading: StaffTelemetryReading | null,
  actuatorType: ActuatorType,
): ActuatorAction | null {
  if (!reading) return null;
  const value = actuatorType === "VENTILATION_FAN"
    ? reading.fanState
    : actuatorType === "LED_LIGHT"
      ? reading.ledState
      : reading.pumpState;
  return value === null ? null : value ? "ON" : "OFF";
}

export function DeviceLatestTelemetry({ deviceId }: { deviceId: number }) {
  const [reading, setReading] = useState<StaffTelemetryReading | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState("");
  const [lastCommand, setLastCommand] = useState<ActuatorLog | null>(null);
  const [requestedActions, setRequestedActions] = useState<Partial<Record<ActuatorType, ActuatorAction>>>({});

  const send = async (
    actuatorType: ActuatorType,
    action: ActuatorAction,
  ) => {
    const key = `${actuatorType}-${action}`;
    const previousAction = requestedActions[actuatorType];
    setSending(key);
    setError("");
    setRequestedActions((current) => ({ ...current, [actuatorType]: action }));
    try {
      setLastCommand(await staffIoTService.command(deviceId, { actuatorType, action }));
    } catch (reason) {
      setRequestedActions((current) => {
        const next = { ...current };
        if (previousAction) next[actuatorType] = previousAction;
        else delete next[actuatorType];
        return next;
      });
      setError(reason instanceof Error ? reason.message : "Không gửi được lệnh điều khiển.");
    } finally {
      setSending("");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const value = await staffIoTService.latestTelemetry(deviceId);
        if (!cancelled) {
          setReading(value);
          setRequestedActions((current) => {
            const next = { ...current };
            let changed = false;
            (Object.keys(current) as ActuatorType[]).forEach((actuatorType) => {
              if (current[actuatorType] === telemetryAction(value, actuatorType)) {
                delete next[actuatorType];
                changed = true;
              }
            });
            return changed ? next : current;
          });
          setError("");
        }
      } catch (reason) {
        if (!cancelled) {
          setReading(null);
          setError(reason instanceof ApiError && reason.status === 404
            ? "Thiết bị chưa có dữ liệu telemetry."
            : reason instanceof Error ? reason.message : "Không tải được telemetry.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 10000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [deviceId]);

  return <div className="rounded-lg border bg-[#F8FBF9] p-4 text-sm">
    <h3 className="font-medium">Dữ liệu mới nhất từ thiết bị</h3>
    {loading && <p className="mt-2 text-muted-foreground">Đang tải...</p>}
    {!loading && error && <p className="mt-2 text-muted-foreground">{error}</p>}
    {reading && <>
      <p className="mt-2 font-medium">{reading.deviceCode} · Device ID {reading.deviceId}</p>
      <p className="mt-1 text-xs text-muted-foreground">Khay ID {reading.soilTrayId}</p>
      <p className="mt-1 text-xs text-muted-foreground">Ghi nhận: {dateTime(reading.recordedAt)}{reading.isStale ? " · Dữ liệu đã cũ" : ""}</p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <span>Nhiệt độ: {reading.temperature ?? "—"} °C</span>
        <span>Ẩm không khí: {reading.airHumidity ?? "—"} %</span>
        <span>Ẩm đất: {reading.soilHumidity ?? "—"} %</span>
        <span>Ánh sáng: {reading.lightIntensity ?? "—"}</span>
        <span>Mực nước: {reading.waterLevel ?? "—"}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        <span>Quạt: {stateLabel(reading.fanState)}</span>
        <span>Đèn: {stateLabel(reading.ledState)}</span>
        <span>Bơm: {stateLabel(reading.pumpState)}</span>
      </div>
      <div className="mt-4 space-y-2 border-t pt-4">
        <p className="font-medium">Điều khiển bật/tắt</p>
        {([
          ["VENTILATION_FAN", "Quạt"],
          ["LED_LIGHT", "Đèn"],
          ["WATER_PUMP", "Bơm"],
        ] as const).map(([actuatorType, label]) => {
          const activeAction = requestedActions[actuatorType] ?? telemetryAction(reading, actuatorType);
          return <div key={actuatorType} className="flex items-center gap-2">
            <span className="w-16">{label}</span>
            <Button type="button" size="sm" variant={activeAction === "ON" ? "default" : "outline"} disabled={!!sending} aria-pressed={activeAction === "ON"} onClick={() => void send(actuatorType, "ON")}>{sending === `${actuatorType}-ON` ? "Đang gửi..." : "Bật"}</Button>
            <Button type="button" size="sm" variant={activeAction === "OFF" ? "default" : "outline"} disabled={!!sending} aria-pressed={activeAction === "OFF"} onClick={() => void send(actuatorType, "OFF")}>{sending === `${actuatorType}-OFF` ? "Đang gửi..." : "Tắt"}</Button>
          </div>;
        })}
        {lastCommand && <p className="text-xs text-muted-foreground">Lệnh {lastCommand.actuatorType} {lastCommand.action}: {lastCommand.result}</p>}
      </div>
    </>}
  </div>;
}
