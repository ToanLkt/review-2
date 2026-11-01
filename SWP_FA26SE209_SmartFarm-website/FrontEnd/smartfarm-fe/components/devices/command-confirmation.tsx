"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { commandGuard, type Device } from "@/lib/devices";
import { useDevices } from "./devices-provider";
export function CommandControls({
  device,
  onCommand,
}: {
  device: Device;
  onCommand: (d: Device, action: "on" | "off") => void;
}) {
  const { commands } = useDevices();
  const pending = commands.find(
    (c) =>
      c.deviceId === device.id && ["sending", "waiting"].includes(c.result),
  );
  const reason = commandGuard(device, commands);
  if (pending)
    return (
      <span role="status" className="text-xs text-amber-700">
        {pending.result === "sending" ? "Đang gửi lệnh" : "Chờ xác nhận"}
      </span>
    );
  const actions: ("on" | "off")[] =
    device.reported === "unknown"
      ? ["on", "off"]
      : [device.reported === "on" ? "off" : "on"];
  return (
    <>
      {actions.map((a) => (
        <Tooltip key={a}>
          <TooltipTrigger asChild>
            <span
              tabIndex={reason ? 0 : undefined}
              className="inline-flex rounded focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Button
                size="sm"
                variant="outline"
                disabled={!!reason}
                aria-label={`${a === "on" ? "Bật" : "Tắt"} ${device.name}`}
                onClick={() => onCommand(device, a)}
              >
                {a === "on" ? "Bật" : "Tắt"}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {reason || "Gửi yêu cầu; trạng thái chỉ đổi khi có xác nhận."}
          </TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}
export function CommandConfirmation({
  device,
  requested,
  onClose,
}: {
  device: Device;
  requested: "on" | "off";
  onClose: () => void;
}) {
  const { send } = useDevices();
  const [duration, setDuration] = useState("30"),
    [error, setError] = useState("");
  const pump = device.type === "pump" && requested === "on";
  function confirm() {
    if (
      pump &&
      (!Number.isInteger(Number(duration)) ||
        Number(duration) < 1 ||
        Number(duration) > 300)
    ) {
      setError("Nhập số nguyên từ 1 đến 300 giây.");
      return;
    }
    if (send(device.id, requested, pump ? Number(duration) : undefined))
      onClose();
  }
  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="rounded-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Xác nhận {requested === "on" ? "bật" : "tắt"} thiết bị?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {device.name} · {device.id} · Khu {device.area} · {device.location}.
            Thao tác này chỉ dùng để xem trước; thiết bị trong nông trại không thay đổi.
            Trạng thái báo về chỉ thay đổi sau xác nhận.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pump && (
          <div className="space-y-2">
            <label htmlFor="pump-duration" className="text-sm font-medium">
              Thời gian chạy (giây)
            </label>
            <Input
              id="pump-duration"
              type="number"
              min={1}
              max={300}
              step={1}
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
            />
            <p className="text-xs text-muted-foreground">
              Từ 1 đến 300 giây. Máy bơm sẽ tự dừng khi hết thời gian đã chọn.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <Button onClick={confirm}>
            Xác nhận {requested === "on" ? "bật" : "tắt"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
